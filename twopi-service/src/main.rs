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
mod error;
mod keys;
mod model;
mod routes;
mod user_entity;

use std::{
    collections::HashSet,
    num::NonZeroUsize,
    path::PathBuf,
    sync::{Arc, LazyLock},
};

use anyhow::Context;
use argon2::{
    Argon2, PasswordHasher,
    password_hash::{SaltString, rand_core::OsRng},
};
use auth::{Backend, Credentials};
use axum::{
    Json,
    extract::{FromRequest, FromRequestParts, Query, Request, rejection::JsonRejection},
    http::StatusCode,
};
use axum_login::{
    AuthManagerLayerBuilder, login_required,
    tower_sessions::{ExpiredDeletion, SessionManagerLayer},
};
use cache::CacheManager;
use clap::{Parser, Subcommand};
use error::{AppError, AppResult};
use keys::{generate_verify_url, verify_email};
use lru::LruCache;
use migration::{Migrator, MigratorTrait};
use model::user::User;
use sea_orm::{ConnectOptions, Database, DatabaseConnection, sqlx::SqlitePool};
use serde::{Deserialize, de::DeserializeOwned};
use tokio::{runtime::Handle, sync::Mutex};
use tower_http::services::{ServeDir, ServeFile};
use tower_sessions_sqlx_store::SqliteStore;
use user_migration::Migrator as UserMigrator;
use utoipa::{IntoParams, OpenApi, ToSchema};
use utoipa_axum::{router::OpenApiRouter, routes};
use utoipa_rapidoc::RapiDoc;
use utoipa_scalar::{Scalar, Servable as ScalarServable};
use utoipa_swagger_ui::SwaggerUi;
use validator::Validate;

static DATA_DIR: LazyLock<PathBuf> = LazyLock::new(|| {
    #[allow(clippy::unwrap_used)]
    let dir = std::env::var("TWOPI_DATA_DIR")
        .context("TWOPI_DATA_DIR env var not set")
        .unwrap();
    PathBuf::from(dir)
});

static KEYS: LazyLock<keys::Keys> = LazyLock::new(|| {
    #[allow(clippy::unwrap_used)]
    let secret_key = std::env::var("TWOPI_SECRET_KEY")
        .context("TWOPI_SECRET_KEY env var not set")
        .unwrap();
    keys::Keys::new(secret_key.as_bytes())
});

#[derive(Parser)]
struct Cli {
    #[command(subcommand)]
    command: Option<Command>,
}

#[derive(Subcommand)]
enum Command {
    /// Generate the `OpenAPI` schema
    GenApi {
        /// Output file
        output: PathBuf,
    },
}

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

    let cli = Cli::parse();
    if !tokio::fs::try_exists(DATA_DIR.as_path()).await? {
        tokio::fs::create_dir_all(DATA_DIR.as_path()).await?;
    }
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

    let serve_dir = ServeDir::new("../twopi-web/dist");
    let serve_file = ServeFile::new("../twopi-web/dist/index.html");
    let routes = include_str!("../routes.gen.txt");
    let routes: HashSet<&str> = routes
        .trim()
        .lines()
        .map(|l| l.trim().trim_end_matches('/'))
        .filter(|l| !l.is_empty() && l.starts_with('/'))
        .collect();

    let (mut router, api) = OpenApiRouter::with_openapi(ApiDoc::openapi())
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
                .nest("/dashboard", routes::dashboard::router())
                .nest(
                    "/api",
                    OpenApiRouter::new()
                        .routes(routes![user])
                        .routes(routes![send_verify_url])
                        .route_layer(login_required!(Backend))
                        .routes(routes![get_verify_email])
                        .routes(routes![signin])
                        .routes(routes![signout])
                        .routes(routes![signup])
                        .routes(routes![reset_data]),
                )
                .layer(auth_layer),
        )
        .split_for_parts();

    router = router.fallback_service(serve_dir);
    for path in routes {
        tracing::info!("TwoPi Web Route: {}", path);
        router = router.route_service(path, serve_file.clone());
    }

    if let Some(Command::GenApi { output }) = cli.command {
        let api_doc = api.to_pretty_json()?;
        std::fs::write(&output, api_doc)?;
        return Ok(());
    }

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

static DATABASE_LOCK: LazyLock<Mutex<LruCache<String, DatabaseConnection>>> = LazyLock::new(|| {
    Mutex::new(LruCache::new(
        #[allow(clippy::unwrap_used)]
        NonZeroUsize::new(100).unwrap(),
    ))
});

#[tracing::instrument]
async fn database(id: &str) -> AppResult<DatabaseConnection> {
    let mut lock = DATABASE_LOCK.lock().await;
    let db = lock
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
        .clone();
    drop(lock);
    Migrator::up(&db, None).await.map_err(AppError::DbErr)?;
    Ok(db)
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

type AuthSession = axum_login::AuthSession<Backend>;

#[derive(Debug)]
struct XUserId(String);

impl<S> FromRequestParts<S> for XUserId
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        state: &S,
    ) -> Result<Self, Self::Rejection> {
        let session: AuthSession = axum_login::AuthSession::from_request_parts(parts, state)
            .await
            .map_err(|(_, e)| AppError::Other(anyhow::anyhow!(e)))?;
        let user = session
            .user
            .ok_or_else(|| AppError::Unauthorized(anyhow::anyhow!("Not logged in")))?;
        if user.email_verified {
            Ok(Self(user.id.to_string()))
        } else {
            Err(AppError::Unauthorized(anyhow::anyhow!(
                "Email not verified"
            )))
        }
    }
}

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
    match auth_session.logout().await {
        Err(e) => {
            tracing::error!("Error logging out: {:?}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Session error".to_string(),
            ))
        }
        _ => Ok(()),
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
    auth_session: AuthSession,
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

    print_verify_url(&user).await.map_err(|e| {
        tracing::error!("Error generating verify url: {:?}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Error generating verify url".to_string(),
        )
    })?;

    Err((
        StatusCode::UNAUTHORIZED,
        "Please verify your email".to_string(),
    ))
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
    (status = UNAUTHORIZED, body = ()),
    (status = INTERNAL_SERVER_ERROR, body = ())
))]
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

#[tracing::instrument]
#[utoipa::path(post, path = "/reset-account", responses(
    (status = OK, body = ()),
    (status = UNAUTHORIZED, body = String),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn reset_data(XUserId(id): XUserId) -> Result<(), (StatusCode, String)> {
    let db = database(&id).await.map_err(|e| {
        tracing::error!("Error getting database: {:?}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Database error".to_string(),
        )
    })?;
    Migrator::down(&db, None).await.map_err(|e| {
        tracing::error!("Error migrating down: {:?}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Migration error".to_string(),
        )
    })?;
    Migrator::up(&db, None).await.map_err(|e| {
        tracing::error!("Error migrating up: {:?}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Migration error".to_string(),
        )
    })?;
    Ok(())
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
