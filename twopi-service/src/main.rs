#![forbid(unsafe_code)]
#![warn(
    clippy::pedantic,
    clippy::nursery,
    clippy::unwrap_used,
    clippy::expect_used
)]

use async_graphql::{
    http::GraphiQLSource, Context, EmptySubscription, Object, Schema, SimpleObject,
};
use axum::{
    extract::{Query, State},
    http::{HeaderMap, StatusCode},
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
        .route("/graphql", get(graphiql).post(post_graphql))
        .route("/currency", get(currency))
        .with_state(schema);
    let listener = tokio::net::TcpListener::bind("127.0.0.1:8000").await?;
    tracing::info!("Starting server on {}", listener.local_addr()?);
    axum::serve(listener, app).await?;
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

async fn graphiql() -> impl IntoResponse {
    Html(
        GraphiQLSource::build()
            .endpoint("/graphql")
            .header(USER_ID_HEADER_NAME, "dev")
            .finish(),
    )
}

#[axum::debug_handler]
async fn post_graphql(
    State(schema): State<Schema<QueryRoot, MutationRoot, EmptySubscription>>,
    headers: HeaderMap,
    mut request: async_graphql_axum::GraphQLRequest,
) -> async_graphql_axum::GraphQLResponse {
    let id = headers
        .get(USER_ID_HEADER_NAME)
        .and_then(|value| value.to_str().ok())
        .map(std::string::ToString::to_string);
    if let Some(id) = id {
        request.0.data.insert(Id { id });
    }
    async_graphql_axum::GraphQLResponse::from(schema.execute(request.0).await)
}

type Storage = Mutex<()>;

struct QueryRoot;

#[derive(SimpleObject)]
struct Currency {
    code: String,
    name: String,
    decimal_digits: i32,
}

#[Object]
impl QueryRoot {
    async fn currency(&self, ctx: &Context<'_>) -> async_graphql::Result<Vec<Currency>> {
        let Id { id } = ctx.data::<Id>()?;
        tracing::info!("Querying currency for {}", id);
        let db = database(id).await?;
        let currency = entity::currency::Entity::find().all(&db).await?;
        Ok(currency
            .into_iter()
            .map(|c| Currency {
                code: c.code.to_string(),
                name: c.name,
                decimal_digits: c.decimal_digits,
            })
            .collect())
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
