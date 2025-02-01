#![forbid(unsafe_code)]
#![warn(
    clippy::pedantic,
    clippy::nursery,
    clippy::unwrap_used,
    clippy::expect_used
)]

#[allow(unused_imports)]
mod entity;

mod cache;
mod routes;

use std::{path::PathBuf, sync::Arc};

use anyhow::Context;
use axum::{
    http::{HeaderName, HeaderValue, StatusCode},
    response::{IntoResponse, Response},
};
use axum_extra::headers::Header;
use cache::CacheManager;
use migration::{Migrator, MigratorTrait};
use sea_orm::{ConnectOptions, Database, DatabaseConnection};
use tokio::sync::Mutex;
use utoipa::IntoParams;
use utoipa_axum::router::OpenApiRouter;
use utoipa_swagger_ui::SwaggerUi;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();

    let data_dir = std::env::var("TWOPI_DATA_DIR").context("TWOPI_DATA_DIR env var not set")?;
    let data_dir = PathBuf::from(data_dir).join("currency");
    let api_key = std::env::var("CURRENCY_API_KEY").context("CURRENCY_API_KEY env var not set")?;

    let cache = Arc::new(Mutex::new(CacheManager::new(data_dir.clone(), api_key)));

    let (router, mut api) = OpenApiRouter::new()
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
        .split_for_parts();
    api.info = utoipa::openapi::Info::new("TwoPI API", "alpha");
    let router = router.merge(SwaggerUi::new("/swagger-ui").url("/api.json", api));

    let listener = tokio::net::TcpListener::bind("127.0.0.1:8000").await?;
    tracing::info!("Starting server on {}", listener.local_addr()?);
    axum::serve(listener, router).await?;
    Ok(())
}

static USER_ID_HEADER_NAME: &str = "x-user-id";

struct AppError(anyhow::Error);

type AppResult<T> = Result<T, AppError>;

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        tracing::error!("{:?}", self.0);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Something went wrong: {}", self.0),
        )
            .into_response()
    }
}

impl<E> From<E> for AppError
where
    E: Into<anyhow::Error>,
{
    fn from(err: E) -> Self {
        Self(err.into())
    }
}

async fn database(id: &str) -> anyhow::Result<DatabaseConnection> {
    let connect_options =
        ConnectOptions::new(format!("sqlite://../data/database/{id}.db?mode=rwc"));
    let db = Database::connect(connect_options).await?;
    Migrator::up(&db, None).await?;
    Ok(db)
}

#[derive(IntoParams)]
#[into_params(names("x-user-id"), parameter_in = Header)]
struct XUserId(String);

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
