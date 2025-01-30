#![forbid(unsafe_code)]
#![warn(
    clippy::pedantic,
    clippy::nursery,
    clippy::unwrap_used,
    clippy::expect_used
)]

use async_graphql::{http::GraphiQLSource, Context, EmptySubscription, Object, Schema};
use async_graphql_axum::GraphQL;
use axum::{
    extract::Query,
    http::StatusCode,
    response::{Html, IntoResponse, Response},
    routing::get,
    Json, Router,
};
use migration::{Migrator, MigratorTrait};
use sea_orm::{ConnectOptions, Database, DatabaseConnection, EntityTrait};
use serde::Deserialize;
use tokio::sync::Mutex;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();
    let schema = Schema::build(QueryRoot, MutationRoot, EmptySubscription)
        .data(Storage::default())
        .finish();
    let app = Router::new()
        .route("/", get(graphiql).post_service(GraphQL::new(schema)))
        .route("/currency", get(currency));
    let listener = tokio::net::TcpListener::bind("127.0.0.1:8000").await?;
    tracing::info!("Starting server on {}", listener.local_addr()?);
    axum::serve(listener, app).await?;
    Ok(())
}

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

async fn graphiql() -> impl IntoResponse {
    Html(GraphiQLSource::build().endpoint("/").finish())
}

type Storage = Mutex<()>;

struct QueryRoot;

#[Object]
impl QueryRoot {
    async fn hello(&self, _ctx: &Context<'_>) -> &'static str {
        "Hello, world!"
    }
}

struct MutationRoot;

#[Object]
impl MutationRoot {
    async fn hello_mut(&self, _ctx: &Context<'_>) -> &'static str {
        "Hello, world!"
    }
}

#[derive(Deserialize)]
struct Id {
    id: String,
}

#[axum::debug_handler]
async fn currency(Query(Id { id }): Query<Id>) -> Result<impl IntoResponse, AppError> {
    let db = database(&id).await?;
    let currency = entity::currency::Entity::find().all(&db).await?;
    Ok(Json(currency))
}
