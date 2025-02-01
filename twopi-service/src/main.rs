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
    extract::State,
    http::{HeaderName, HeaderValue, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use axum_extra::{headers::Header, TypedHeader};
use cache::CacheManager;
use migration::{Migrator, MigratorTrait, OnConflict};
use sea_orm::{ActiveValue, ConnectOptions, Database, DatabaseConnection, EntityTrait};
use serde::Serialize;
use tokio::sync::Mutex;
use utoipa::{IntoParams, ToSchema};
use utoipa_axum::{router::OpenApiRouter, routes};
use utoipa_swagger_ui::SwaggerUi;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();

    let data_dir = std::env::var("TWOPI_DATA_DIR").context("TWOPI_DATA_DIR env var not set")?;
    let data_dir = PathBuf::from(data_dir).join("currency");
    let api_key = std::env::var("CURRENCY_API_KEY").context("CURRENCY_API_KEY env var not set")?;

    let cache = CacheManager::new(data_dir.clone(), api_key);

    let (router, mut api) = OpenApiRouter::new()
        .routes(routes![currency, sync_currency])
        .nest("/currency-cache", routes::currency_cache::router())
        .with_state(Arc::new(Mutex::new(cache)))
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

#[derive(ToSchema, Serialize)]
struct Currency {
    code: String,
    name: String,
    decimal_digits: i32,
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

#[axum::debug_handler]
#[utoipa::path(get, path = "/currency", params(XUserId), responses(
    (status = OK, body = Vec<Currency>),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn currency(TypedHeader(id): TypedHeader<XUserId>) -> AppResult<impl IntoResponse> {
    let db = database(&id.0).await?;
    tracing::info!("Querying currency for {}", id.0);
    let currency = entity::currency::Entity::find().all(&db).await?;
    Ok(Json(
        currency
            .into_iter()
            .map(|c| Currency {
                code: c.code.to_string(),
                name: c.name,
                decimal_digits: c.decimal_digits,
            })
            .collect::<Vec<_>>(),
    ))
}

#[axum::debug_handler]
#[utoipa::path(post, path = "/sync-currency", params(XUserId), responses(
    (status = OK, body = ()),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn sync_currency(
    TypedHeader(id): TypedHeader<XUserId>,
    State(cache): State<Arc<Mutex<CacheManager>>>,
) -> AppResult<()> {
    let db = database(&id.0).await?;
    tracing::info!("Syncing currency for {}", id.0);
    let currencies = cache.lock().await.currencies().await?;
    for currency in currencies.data.values() {
        if currency.type_ != "fiat" {
            continue;
        }
        let currency_obj = entity::currency::ActiveModel {
            code: ActiveValue::Set(currency.code.clone()),
            name: ActiveValue::Set(currency.name.clone()),
            decimal_digits: ActiveValue::Set(currency.decimal_digits),
        };
        entity::currency::Entity::insert(currency_obj)
            .on_conflict(
                OnConflict::column(entity::currency::Column::Code)
                    .update_columns([
                        entity::currency::Column::Name,
                        entity::currency::Column::DecimalDigits,
                    ])
                    .to_owned(),
            )
            .exec(&db)
            .await?;
    }
    Ok(())
}
