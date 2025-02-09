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
    extract::{FromRequestParts, Request},
    http::{StatusCode, Uri},
    response::{IntoResponse, Response},
    Json,
};
use axum_login::{
    login_required,
    tower_sessions::{MemoryStore, SessionManagerLayer},
    AuthManagerLayerBuilder,
};
use cache::CacheManager;
use hyper_util::{client::legacy::connect::HttpConnector, rt::TokioExecutor};
use lru::LruCache;
use migration::MigratorTrait;
use model::user::User;
use sea_orm::{ConnectOptions, Database, DatabaseConnection, DbErr};
use serde::Deserialize;
use tokio::{runtime::Handle, sync::Mutex};
use user_migration::Migrator as UserMigrator;
use utoipa::{OpenApi, ToSchema};
use utoipa_axum::{router::OpenApiRouter, routes};
use utoipa_rapidoc::RapiDoc;
use utoipa_scalar::{Scalar, Servable as ScalarServable};
use utoipa_swagger_ui::SwaggerUi;

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

type Client = hyper_util::client::legacy::Client<HttpConnector, Body>;

#[tokio::main]
#[tracing::instrument]
async fn main() -> anyhow::Result<()> {
    #[derive(OpenApi)]
    #[openapi(info(
        title = "TwoPi API",
        license(name = "MIT", url = "https://opensource.org/licenses/MIT")
    ))]
    struct ApiDoc;

    tracing_subscriber::fmt::init();

    let data_dir = DATA_DIR.join("currency");
    let api_key = std::env::var("CURRENCY_API_KEY").context("CURRENCY_API_KEY env var not set")?;

    let cache = Arc::new(Mutex::new(CacheManager::new(data_dir.clone(), api_key)));

    let session_store = MemoryStore::default();
    let session_layer = SessionManagerLayer::new(session_store);

    let backend = Backend::new(auth_database().await?);
    let auth_layer = AuthManagerLayerBuilder::new(backend, session_layer).build();

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
                        .route_layer(login_required!(Backend))
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
    Ok(())
}

#[derive(Debug, thiserror::Error)]
enum AppError {
    #[error("Database error: {0}")]
    DbErr(#[from] DbErr),
    #[error("App error: {0}")]
    Other(anyhow::Error),
}

type AppResult<T> = Result<T, AppError>;

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        tracing::error!("{:?}", self);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Something went wrong: {self}"),
        )
            .into_response()
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
    let db_dir = DATA_DIR.join("auth.db");
    let db_dir = db_dir.to_string_lossy();
    let connect_options = ConnectOptions::new(format!("sqlite://{db_dir}?mode=rwc"));
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
    type Rejection = StatusCode;

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        state: &S,
    ) -> Result<Self, Self::Rejection> {
        let session: AuthSession = axum_login::AuthSession::from_request_parts(parts, state)
            .await
            .map_err(|(s, _)| s)?;
        let user_id = session.user.map(|u| u.id);
        user_id
            .ok_or(StatusCode::UNAUTHORIZED)
            .map(|id| Self(id.to_string()))
    }
}

type AuthSession = axum_login::AuthSession<Backend>;

#[tracing::instrument(skip(auth_session, creds))]
#[utoipa::path(post, path = "/signin", responses(
    (status = OK, body = ()),
    (status = UNAUTHORIZED, body = String),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn signin(
    mut auth_session: AuthSession,
    Json(creds): Json<Credentials>,
) -> Result<(), (StatusCode, String)> {
    let user = match auth_session.authenticate(creds.clone()).await {
        Ok(Some(user)) => user,
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
