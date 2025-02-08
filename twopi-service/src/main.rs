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
    body::Body,
    extract::Request,
    http::{HeaderName, HeaderValue, StatusCode, Uri},
    response::{IntoResponse, Response},
    routing::get,
    Form, Json,
};
use axum_extra::headers::Header;
use axum_login::{
    login_required,
    tower_sessions::{MemoryStore, SessionManagerLayer},
    AuthManagerLayerBuilder,
};
use cache::CacheManager;
use hyper_util::{client::legacy::connect::HttpConnector, rt::TokioExecutor};
use migration::{Migrator, MigratorTrait};
use model::user::User;
use sea_orm::{ConnectOptions, Database, DatabaseConnection, DbErr};
use serde::Deserialize;
use tokio::sync::Mutex;
use user_migration::Migrator as UserMigrator;
use utoipa::{IntoParams, OpenApi, ToSchema};
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
                        .route(
                            "/protected",
                            get(|| async { "Gotta be logged in to see me!" }),
                        )
                        .route_layer(login_required!(Backend, login_url = "/twopi-api/signin"))
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
#[utoipa::path(post, path = "/signin", responses(
    (status = OK, body = ()),
    (status = UNAUTHORIZED),
    (status = INTERNAL_SERVER_ERROR)
))]
async fn signin(
    mut auth_session: AuthSession,
    Form(creds): Form<Credentials>,
) -> Result<impl IntoResponse, StatusCode> {
    let user = match auth_session.authenticate(creds.clone()).await {
        Ok(Some(user)) => user,
        Ok(None) => return Err(StatusCode::UNAUTHORIZED),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    };

    if auth_session.login(&user).await.is_err() {
        return Err(StatusCode::INTERNAL_SERVER_ERROR);
    }

    Ok(())
}

#[tracing::instrument(skip(auth_session))]
#[utoipa::path(post, path = "/signout", responses(
    (status = OK),
    (status = INTERNAL_SERVER_ERROR)
))]
async fn signout(mut auth_session: AuthSession) -> StatusCode {
    if auth_session.logout().await.is_err() {
        StatusCode::INTERNAL_SERVER_ERROR
    } else {
        StatusCode::OK
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
    (status = OK),
    (status = INTERNAL_SERVER_ERROR)
))]
async fn signup(mut auth_session: AuthSession, Json(user): Json<NewSignup>) -> StatusCode {
    let user = match User::create_user(
        auth_session.backend.db(),
        &user.name,
        &user.email,
        &user.password,
    )
    .await
    {
        Ok(user) => user,
        Err(e) => {
            tracing::error!("Error creating user: {:?}", e);
            return StatusCode::INTERNAL_SERVER_ERROR;
        }
    };

    if auth_session.login(&user).await.is_err() {
        return StatusCode::INTERNAL_SERVER_ERROR;
    }

    StatusCode::OK
}
