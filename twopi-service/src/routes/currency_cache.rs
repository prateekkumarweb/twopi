use std::sync::Arc;

use axum::{
    extract::{Query, State},
    response::IntoResponse,
    Json,
};
use reqwest::StatusCode;
use serde::Deserialize;
use tokio::sync::Mutex;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::{
    cache::{CacheManager, CurrenciesObject, HistoricalObject},
    AppResult,
};

pub fn router() -> OpenApiRouter<Arc<Mutex<CacheManager>>> {
    OpenApiRouter::new()
        .routes(routes![currencies])
        .routes(routes![latest])
        .routes(routes![historical])
}

#[axum::debug_handler]
#[utoipa::path(get, path = "/currencies", responses(
    (status = OK, body = CurrenciesObject),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn currencies(State(cache): State<Arc<Mutex<CacheManager>>>) -> AppResult<impl IntoResponse> {
    Ok(cache
        .lock()
        .await
        .currencies()
        .await
        .map(|e| (StatusCode::OK, Json(e)))?)
}

#[axum::debug_handler]
#[utoipa::path(get, path = "/latest", responses(
    (status = OK, body = HistoricalObject),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
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

#[axum::debug_handler]
#[utoipa::path(get, path = "/historical", responses(
    (status = OK, body = HistoricalObject),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
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
