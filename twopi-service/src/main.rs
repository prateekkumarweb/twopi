#![forbid(unsafe_code)]
#![warn(
    clippy::pedantic,
    clippy::nursery,
    clippy::unwrap_used,
    clippy::expect_used
)]

#[allow(unused_imports)]
mod entity;

use axum::{
    http::{HeaderName, HeaderValue, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use axum_extra::{headers::Header, TypedHeader};
use migration::{Migrator, MigratorTrait};
use sea_orm::{ConnectOptions, Database, DatabaseConnection, EntityTrait};
use serde::Serialize;
use utoipa::ToSchema;
use utoipa_axum::{router::OpenApiRouter, routes};
use utoipa_swagger_ui::SwaggerUi;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();
    let (router, mut api) = OpenApiRouter::new()
        .routes(routes!(currency))
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
    // let status = Migrator::get_migration_with_status(&db).await?;
    // tracing::info!(
    //     "Connected to database {}, migration status: {:?}",
    //     &id,
    //     status
    //         .iter()
    //         .map(|m| (m.name(), m.status()))
    //         .collect::<Vec<_>>()
    // );
    Migrator::up(&db, None).await?;
    Ok(db)
}

#[derive(ToSchema, Serialize)]
struct Currency {
    code: String,
    name: String,
    decimal_digits: i32,
}

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
#[utoipa::path(get, path = "/currency", responses(
    (status = OK, body = Vec<Currency>),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn currency(TypedHeader(id): TypedHeader<XUserId>) -> Result<impl IntoResponse, AppError> {
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
