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
    path::PathBuf,
    sync::{Arc, LazyLock},
};

use anyhow::Context;
use auth::{Backend, Credentials};
use axum::{
    http::{HeaderName, HeaderValue, StatusCode},
    response::{Html, IntoResponse, Redirect, Response},
    routing::{get, post},
    Form,
};
use axum_extra::headers::Header;
use axum_login::{
    login_required,
    tower_sessions::{MemoryStore, SessionManagerLayer},
    AuthManagerLayerBuilder,
};
use cache::CacheManager;
use migration::{Migrator, MigratorTrait};
use sea_orm::{ConnectOptions, Database, DatabaseConnection, DbErr};
use tokio::sync::Mutex;
use user_migration::Migrator as UserMigrator;
use utoipa::{IntoParams, OpenApi};
use utoipa_axum::router::OpenApiRouter;
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
                .route(
                    "/protected",
                    get(|| async { "Gotta be logged in to see me!" }),
                )
                .route_layer(login_required!(Backend, login_url = "/api/login"))
                .route("/login", post(login))
                .route("/login", get(login_page)),
        )
        .layer(auth_layer)
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

static USER_ID_HEADER_NAME: &str = "x-user-id";

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

#[tracing::instrument]
async fn database(id: &str) -> AppResult<DatabaseConnection> {
    let db_dir = DATA_DIR.join("database");
    std::fs::create_dir_all(&db_dir)
        .context("Could not create database directory")
        .map_err(AppError::Other)?;
    let db_dir = db_dir.to_string_lossy();
    let connect_options = ConnectOptions::new(format!("sqlite://{db_dir}/{id}.db?mode=rwc"));
    let db = Database::connect(connect_options)
        .await
        .map_err(AppError::DbErr)?;
    Migrator::up(&db, None).await.map_err(AppError::DbErr)?;
    Ok(db)
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

#[derive(Debug, IntoParams)]
#[into_params(names("x-user-id"), parameter_in = Header)]
struct XUserId(#[param(default = "dev")] String);

static XUSER_ID_HEADER_NAME: HeaderName = HeaderName::from_static(USER_ID_HEADER_NAME);

impl Header for XUserId {
    fn name() -> &'static HeaderName {
        &XUSER_ID_HEADER_NAME
    }

    fn decode<'i, I>(values: &mut I) -> Result<Self, axum_extra::headers::Error>
    where
        Self: Sized,
        I: Iterator<Item = &'i axum::http::HeaderValue>,
    {
        values
            .next()
            .and_then(|value| value.to_str().map(|v| Self(v.to_string())).ok())
            .ok_or_else(axum_extra::headers::Error::invalid)
    }

    fn encode<E: Extend<axum::http::HeaderValue>>(&self, values: &mut E) {
        #[allow(clippy::expect_used)] // safe because we know the value is valid
        let mut value = HeaderValue::from_str(&self.0).expect("HeaderValue could not be encoded");
        value.set_sensitive(true);
        values.extend(std::iter::once(value));
    }
}

type AuthSession = axum_login::AuthSession<Backend>;

#[tracing::instrument(skip(auth_session, creds))]
async fn login(mut auth_session: AuthSession, Form(creds): Form<Credentials>) -> impl IntoResponse {
    let user = match auth_session.authenticate(creds.clone()).await {
        Ok(Some(user)) => user,
        Ok(None) => return StatusCode::UNAUTHORIZED.into_response(),
        Err(_) => return StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    };

    if auth_session.login(&user).await.is_err() {
        return StatusCode::INTERNAL_SERVER_ERROR.into_response();
    }

    Redirect::to("/api/protected").into_response()
}

async fn login_page() -> impl IntoResponse {
    Html(
        "<!doctype html>
    <html>
    <head>
        <title>Login</title>
    </head>
    <body>
        <form method=\"post\">
            <label for=\"email\">Email</label>
            <input type=\"email\" id=\"email\" name=\"email\">
            <label for=\"password\">Password</label>
            <input type=\"password\" id=\"password\" name=\"password\">
            <button type=\"submit\">Login</button>
        </form>
    </body>
    </html>",
    )
}
