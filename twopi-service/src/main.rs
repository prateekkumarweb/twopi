#![forbid(unsafe_code)]
#![warn(
    clippy::pedantic,
    clippy::nursery,
    clippy::unwrap_used,
    clippy::expect_used
)]
#![allow(clippy::cast_sign_loss, clippy::too_many_lines)]

mod auth;
mod cache;
mod entity;
mod keys;
mod model;
mod routes;
mod user_entity;

use std::{
    num::NonZeroUsize,
    path::PathBuf,
    sync::{Arc, LazyLock},
};

use anyhow::Context;
use argon2::{
    password_hash::{rand_core::OsRng, SaltString},
    Argon2, PasswordHasher,
};
use auth::{Backend, Credentials};
use axum::{
    body::Body,
    extract::{rejection::JsonRejection, FromRequest, FromRequestParts, Query, Request},
    http::{StatusCode, Uri},
    response::{IntoResponse, Response},
    Json,
};
use axum_login::{
    login_required,
    tower_sessions::{ExpiredDeletion, SessionManagerLayer},
    AuthManagerLayerBuilder,
};
use cache::CacheManager;
use hyper_util::{client::legacy::connect::HttpConnector, rt::TokioExecutor};
use keys::{generate_verify_url, verify_email};
use lru::LruCache;
use migration::MigratorTrait;
use model::user::User;
use sea_orm::{sqlx::SqlitePool, ConnectOptions, Database, DatabaseConnection, DbErr};
use serde::{de::DeserializeOwned, Deserialize};
use tokio::{runtime::Handle, sync::Mutex};
use tower_sessions_sqlx_store::SqliteStore;
use user_migration::Migrator as UserMigrator;
use utoipa::{openapi::ResponsesBuilder, IntoParams, OpenApi, ToResponse, ToSchema};
use utoipa_axum::{router::OpenApiRouter, routes};
use utoipa_rapidoc::RapiDoc;
use utoipa_scalar::{Scalar, Servable as ScalarServable};
use utoipa_swagger_ui::SwaggerUi;
use validator::{Validate, ValidationErrors};

static DATA_DIR: LazyLock<PathBuf> = LazyLock::new(|| {
    #[allow(clippy::unwrap_used)]
    let dir = std::env::var("TWOPI_DATA_DIR")
        .context("TWOPI_DATA_DIR env var not set")
        .unwrap();
    PathBuf::from(dir)
});

static HYPER_CLIENT: LazyLock<Client> = LazyLock::new(|| {
    let client: Client =
        hyper_util::client::legacy::Client::<(), ()>::builder(TokioExecutor::new())
            .build(HttpConnector::new());
    client
});

static KEYS: LazyLock<keys::Keys> = LazyLock::new(|| {
    #[allow(clippy::unwrap_used)]
    let secret_key = std::env::var("TWOPI_SECRET_KEY")
        .context("TWOPI_SECRET_KEY env var not set")
        .unwrap();
    keys::Keys::new(secret_key.as_bytes())
});

type Client = hyper_util::client::legacy::Client<HttpConnector, Body>;

#[tokio::main]
#[tracing::instrument]
async fn main() -> anyhow::Result<()> {
    #[derive(OpenApi)]
    #[openapi(info(
        title = "TwoPi API",
        license(name = "MIT", url = "https://opensource.org/licenses/MIT"),
    ))]
    struct ApiDoc;

    tracing_subscriber::fmt::init();

    let data_dir = DATA_DIR.join("currency");
    let api_key = std::env::var("CURRENCY_API_KEY").context("CURRENCY_API_KEY env var not set")?;

    let cache = Arc::new(Mutex::new(CacheManager::new(data_dir.clone(), api_key)));

    let db_path = DATA_DIR.join("sessions.db");
    let db_path = db_path.to_string_lossy();
    let pool = SqlitePool::connect(&format!("sqlite://{db_path}?mode=rwc")).await?;
    let session_store = SqliteStore::new(pool);
    session_store.migrate().await?;

    let deletion_task = tokio::task::spawn(
        session_store
            .clone()
            .continuously_delete_expired(tokio::time::Duration::from_secs(60)),
    );

    let session_layer = SessionManagerLayer::new(session_store);

    let backend = Backend::new(auth_database().await?);
    let auth_layer = AuthManagerLayerBuilder::new(backend, session_layer).build();

    LazyLock::force(&KEYS);

    let (router, api) = OpenApiRouter::with_openapi(ApiDoc::openapi())
        .nest(
            "/twopi-api",
            OpenApiRouter::new()
                .nest(
                    "/currency",
                    routes::currency::router().with_state(cache.clone()),
                )
                .nest(
                    "/currency-cache",
                    routes::currency_cache::router().with_state(cache),
                )
                .nest("/account", routes::account::router())
                .nest("/category", routes::category::router())
                .nest("/transaction", routes::transaction::router())
                .nest(
                    "/api",
                    OpenApiRouter::new()
                        .routes(routes![user])
                        .routes(routes![send_verify_url])
                        .route_layer(login_required!(Backend))
                        .routes(routes![get_verify_email])
                        .routes(routes![signin])
                        .routes(routes![signout])
                        .routes(routes![signup]),
                )
                .layer(auth_layer),
        )
        .fallback(twopi_web)
        .split_for_parts();

    let router = router
        .merge(SwaggerUi::new("/swagger-ui").url("/openapi.json", api.clone()))
        .merge(RapiDoc::new("/openapi.json").path("/rapidoc"))
        .merge(Scalar::with_url("/scalar", api));

    let listener = tokio::net::TcpListener::bind("127.0.0.1:8000").await?;
    tracing::info!("Starting server on {}", listener.local_addr()?);
    axum::serve(listener, router).await?;

    deletion_task.await??;
    Ok(())
}

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    DbErr(#[from] DbErr),
    #[error("App error: {0}")]
    Other(anyhow::Error),
    #[error(transparent)]
    ValidationError(#[from] ValidationErrors),
    #[error(transparent)]
    AxumJsonRejection(#[from] JsonRejection),
}

type AppResult<T> = Result<T, AppError>;

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        tracing::error!("Error: {:?}", self);
        match self {
            Self::ValidationError(_) => {
                let message = format!("Input validation error: [{self}]").replace('\n', ", ");
                (StatusCode::BAD_REQUEST, message)
            }
            Self::AxumJsonRejection(_) => (StatusCode::BAD_REQUEST, self.to_string()),
            Self::DbErr(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
            Self::Other(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
        }
        .into_response()
    }
}

#[derive(ToSchema, ToResponse)]
#[allow(dead_code)]
struct AppErrorSchema(String);

impl utoipa::IntoResponses for AppError {
    fn responses() -> std::collections::BTreeMap<
        String,
        utoipa::openapi::RefOr<utoipa::openapi::response::Response>,
    > {
        let mut builder = ResponsesBuilder::new();
        let mut string_schemas = vec![];
        <String as ToSchema>::schemas(&mut string_schemas);
        builder = builder.response("400", <AppErrorSchema as ToResponse>::response().1);
        builder = builder.response("500", <AppErrorSchema as ToResponse>::response().1);
        builder.build().into()
    }
}

#[tracing::instrument(skip(req))]
async fn twopi_web(mut req: Request<Body>) -> Result<Response, StatusCode> {
    let path = req.uri().path();
    let path_query = req
        .uri()
        .path_and_query()
        .map_or(path, axum::http::uri::PathAndQuery::as_str);

    let uri = format!("http://localhost:3000{path_query}");

    #[allow(clippy::unwrap_used)]
    let new_uri = Uri::try_from(uri).unwrap();
    *req.uri_mut() = new_uri;

    Ok(HYPER_CLIENT
        .request(req)
        .await
        .map_err(|e| {
            tracing::info!("Error: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .into_response())
}

static DATABASE_LOCK: LazyLock<Mutex<LruCache<String, DatabaseConnection>>> = LazyLock::new(|| {
    Mutex::new(LruCache::new(
        #[allow(clippy::unwrap_used)]
        NonZeroUsize::new(100).unwrap(),
    ))
});

#[tracing::instrument]
async fn database(id: &str) -> AppResult<DatabaseConnection> {
    let mut lock = DATABASE_LOCK.lock().await;
    Ok(lock
        .try_get_or_insert(id.to_string(), || -> AppResult<DatabaseConnection> {
            let db_dir = DATA_DIR.join("database");
            std::fs::create_dir_all(&db_dir)
                .context("Could not create database directory")
                .map_err(AppError::Other)?;
            let db_dir = db_dir.to_string_lossy();
            let connect_options =
                ConnectOptions::new(format!("sqlite://{db_dir}/{id}.db?mode=rwc"));
            let db = tokio::task::block_in_place(|| {
                Handle::current().block_on(async {
                    Database::connect(connect_options)
                        .await
                        .map_err(AppError::DbErr)
                })
            })?;
            Ok(db)
        })?
        .clone())
}

#[tracing::instrument]
async fn auth_database() -> AppResult<DatabaseConnection> {
    let db_path = DATA_DIR.join("auth.db");
    let db_path = db_path.to_string_lossy();
    let connect_options = ConnectOptions::new(format!("sqlite://{db_path}?mode=rwc"));
    let db = Database::connect(connect_options)
        .await
        .map_err(AppError::DbErr)?;
    UserMigrator::up(&db, None).await.map_err(AppError::DbErr)?;
    Ok(db)
}

#[derive(Debug)]
struct XUserId(String);

impl<S> FromRequestParts<S> for XUserId
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, String);

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        state: &S,
    ) -> Result<Self, Self::Rejection> {
        let session: AuthSession = axum_login::AuthSession::from_request_parts(parts, state)
            .await
            .map_err(|(s, e)| (s, e.to_owned()))?;
        let user_id = session.user.map(|u| u.id);
        user_id
            .ok_or_else(|| (StatusCode::UNAUTHORIZED, "Not logged in".to_string()))
            .map(|id| Self(id.to_string()))
    }
}

type AuthSession = axum_login::AuthSession<Backend>;

#[tracing::instrument(skip(auth_session, creds))]
#[utoipa::path(post, path = "/signin", responses(
    (status = OK, body = ()),
    AppError
))]
async fn signin(
    mut auth_session: AuthSession,
    Json(creds): Json<Credentials>,
) -> Result<(), (StatusCode, String)> {
    let user = match auth_session.authenticate(creds.clone()).await {
        Ok(Some(user)) => {
            if user.email_verified {
                user
            } else {
                print_verify_url(&user).await.map_err(|e| {
                    tracing::error!("Error generating verify url: {:?}", e);
                    (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        "Error generating verify url".to_string(),
                    )
                })?;
                return Err((StatusCode::UNAUTHORIZED, "Email not verified".to_string()));
            }
        }
        Ok(None) => return Err((StatusCode::UNAUTHORIZED, "Invalid credentials".to_string())),
        Err(e) => {
            tracing::error!("Error : {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Database error".to_string(),
            ));
        }
    };

    if let Err(e) = auth_session.login(&user).await {
        tracing::error!("Error logging in: {:?}", e);
        return Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            "Session error".to_string(),
        ));
    }

    Ok(())
}

#[tracing::instrument(skip(auth_session))]
#[utoipa::path(post, path = "/signout", responses(
    (status = OK, body = ()),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn signout(mut auth_session: AuthSession) -> Result<(), (StatusCode, String)> {
    if let Err(e) = auth_session.logout().await {
        tracing::error!("Error logging out: {:?}", e);
        Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            "Session error".to_string(),
        ))
    } else {
        Ok(())
    }
}

#[derive(Debug, Deserialize, ToSchema)]
struct NewSignup {
    name: String,
    email: String,
    password: String,
}

#[tracing::instrument(skip(auth_session, user))]
#[utoipa::path(post, path = "/signup", responses(
    (status = OK, body = ()),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn signup(
    mut auth_session: AuthSession,
    Json(user): Json<NewSignup>,
) -> Result<(), (StatusCode, String)> {
    let argon2 = Argon2::default();
    let salt = SaltString::generate(&mut OsRng);
    let user = match User::create_user(
        auth_session.backend.db(),
        &user.name,
        &user.email,
        &argon2
            .hash_password(user.password.as_bytes(), &salt)
            .map_err(|e| {
                tracing::error!("Error hashing password: {:?}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Hashing error".to_string(),
                )
            })?
            .to_string(),
    )
    .await
    {
        Ok(user) => user,
        Err(e) => {
            tracing::error!("Error creating user: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Database error".to_string(),
            ));
        }
    };

    if let Err(e) = auth_session.login(&user).await {
        tracing::error!("Error logging in: {:?}", e);
        return Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            "Session error".to_string(),
        ));
    }

    Ok(())
}

#[tracing::instrument(skip(auth_session))]
#[utoipa::path(get, path = "/user", responses(
    (status = OK, body = User),
    (status = UNAUTHORIZED, body = String)
))]
async fn user(auth_session: AuthSession) -> Result<Json<User>, (StatusCode, String)> {
    let Some(user) = auth_session.user else {
        return Err((StatusCode::UNAUTHORIZED, "Not logged in".to_string()));
    };
    Ok(Json(user))
}

#[tracing::instrument(skip(auth_session))]
#[utoipa::path(get, path = "/generate-verify-url", responses(
    (status = OK, body = ()),
    (status = UNAUTHORIZED, body = ())
))]
async fn send_verify_url(auth_session: AuthSession) -> Result<(), StatusCode> {
    let user = auth_session.user.ok_or(StatusCode::UNAUTHORIZED)?;
    print_verify_url(&user).await.map_err(|e| {
        tracing::error!("Error generating verify url: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;
    Ok(())
}

async fn print_verify_url(user: &User) -> jsonwebtoken::errors::Result<()> {
    let url = generate_verify_url(user.id, &user.email).await?;
    tracing::info!("Verify URL: {}", url);
    Ok(())
}

#[derive(Debug, Deserialize, IntoParams)]
struct VerifyQuery {
    token: String,
}

#[tracing::instrument]
#[utoipa::path(get, path = "/verify-email",
params(VerifyQuery), responses(
    (status = OK, body = String),
    (status = UNAUTHORIZED, body = String),
    (status = INTERNAL_SERVER_ERROR, body = ())
))]
#[axum::debug_handler]
async fn get_verify_email(
    Query(VerifyQuery { token }): Query<VerifyQuery>,
) -> Result<String, StatusCode> {
    let id = verify_email(token).await.map_err(|e| {
        tracing::error!("Error verifying url: {:?}", e);
        StatusCode::UNAUTHORIZED
    })?;
    let db = auth_database().await.map_err(|e| {
        tracing::error!("Error getting database: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;
    User::update_email_verified(&db, id, true)
        .await
        .map_err(|e| {
            tracing::error!("Error updating email verified: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
    Ok(id.to_string())
}

#[derive(Debug, Clone, Copy, Default)]
pub struct ValidatedJson<T>(pub T);

impl<T, S> FromRequest<S> for ValidatedJson<T>
where
    T: DeserializeOwned + Validate,
    S: Send + Sync,
    Json<T>: FromRequest<S, Rejection = JsonRejection>,
{
    type Rejection = AppError;

    async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
        let Json(value) = Json::<T>::from_request(req, state).await?;
        value.validate()?;
        Ok(Self(value))
    }
}
