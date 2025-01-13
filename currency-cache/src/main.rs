#![forbid(unsafe_code)]
#![warn(
    clippy::pedantic,
    clippy::nursery,
    clippy::unwrap_used,
    clippy::expect_used
)]

use std::{path::PathBuf, sync::Arc};

use anyhow::Context;
use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::get,
    Json, Router,
};
use cache::CacheManager;
use serde::Deserialize;
use tokio::sync::Mutex;

mod cache;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();

    let data_dir = std::env::var("CURRENCY_DATA").context("CURRENCY_DATA env var not set")?;
    let data_dir = PathBuf::from(data_dir);
    let api_key = std::env::var("CURRENCY_API_KEY").context("CURRENCY_API_KEY env var not set")?;

    let cache = CacheManager::new(data_dir.clone(), api_key);

    if !data_dir.exists() {
        tokio::fs::create_dir_all(&data_dir).await?;
    }

    let app = Router::new()
        .route("/currencies", get(currencies))
        .route("/latest", get(latest))
        .route("/historical", get(historical))
        .with_state(Arc::new(Mutex::new(cache)));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:4670").await?;
    tracing::info!("listening on {}", listener.local_addr()?);
    axum::serve(listener, app).await.context("Failed to serve")
}

struct AppError(anyhow::Error);

type AppResult<T> = Result<T, AppError>;

impl<E> From<E> for AppError
where
    E: Into<anyhow::Error>,
{
    fn from(err: E) -> Self {
        Self(err.into())
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "error": format!("{}", self.0),
            })),
        )
            .into_response()
    }
}

#[axum_macros::debug_handler]
async fn currencies(State(cache): State<Arc<Mutex<CacheManager>>>) -> AppResult<impl IntoResponse> {
    Ok(cache
        .lock()
        .await
        .currencies()
        .await
        .map(|e| (StatusCode::OK, Json(e)))?)
}

#[axum_macros::debug_handler]
async fn latest(State(cache): State<Arc<Mutex<CacheManager>>>) -> AppResult<impl IntoResponse> {
    Ok(cache
        .lock()
        .await
        .latest()
        .await
        .map(|e| (StatusCode::OK, Json(e)))?)
}

#[derive(Debug, Deserialize)]
struct HistoricalQuery {
    date: String,
}

#[axum_macros::debug_handler]
async fn historical(
    State(cache): State<Arc<Mutex<CacheManager>>>,
    Query(query): Query<HistoricalQuery>,
) -> AppResult<impl IntoResponse> {
    Ok(cache
        .lock()
        .await
        .historical(&query.date)
        .await
        .map(|e| (StatusCode::OK, Json(e)))?)
}
