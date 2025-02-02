use std::sync::Arc;

use axum::{
    extract::{Query, State},
    Json,
};
use serde::Deserialize;
use tokio::sync::Mutex;
use utoipa::IntoParams;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::{
    cache::{CacheManager, CurrenciesObject, HistoricalObject},
    AppError, AppResult,
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
async fn currencies(
    State(cache): State<Arc<Mutex<CacheManager>>>,
) -> AppResult<Json<CurrenciesObject>> {
    Ok(Json(
        cache
            .lock()
            .await
            .currencies()
            .await
            .map_err(AppError::Other)?,
    ))
}

#[axum::debug_handler]
#[utoipa::path(get, path = "/latest", responses(
    (status = OK, body = HistoricalObject),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn latest(
    State(cache): State<Arc<Mutex<CacheManager>>>,
) -> AppResult<Json<HistoricalObject>> {
    Ok(Json(
        cache.lock().await.latest().await.map_err(AppError::Other)?,
    ))
}

#[derive(Debug, Deserialize, IntoParams)]
struct HistoricalQuery {
    date: String,
}

#[axum::debug_handler]
#[utoipa::path(get, path = "/historical", params(HistoricalQuery), responses(
    (status = OK, body = HistoricalObject),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn historical(
    State(cache): State<Arc<Mutex<CacheManager>>>,
    Query(query): Query<HistoricalQuery>,
) -> AppResult<Json<HistoricalObject>> {
    Ok(Json(
        cache
            .lock()
            .await
            .historical(&query.date)
            .await
            .map_err(AppError::Other)?,
    ))
}
