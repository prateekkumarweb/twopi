use std::{path::PathBuf, sync::Arc};

use anyhow::Context;
use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::get,
    Json, Router,
};
use jiff::{tz::TimeZone, Timestamp, ZonedRound};
use reqwest::Client;
use serde::Deserialize;

struct Settings {
    data_dir: PathBuf,
    api_key: String,
    client: Client,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();

    let data_dir = std::env::var("CURRENCY_DATA").context("CURRENCY_DATA env var not set")?;
    let data_dir = PathBuf::from(data_dir);
    let api_key = std::env::var("CURRENCY_API_KEY").context("CURRENCY_API_KEY env var not set")?;
    let client = reqwest::Client::new();
    let settings = Settings {
        data_dir,
        api_key,
        client,
    };

    if !settings.data_dir.exists() {
        tokio::fs::create_dir_all(&settings.data_dir).await?;
    }

    let app = Router::new()
        .route("/currencies", get(currencies))
        .route("/latest", get(latest))
        .route("/historical", get(historical))
        .with_state(Arc::new(settings));

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
async fn currencies(State(settings): State<Arc<Settings>>) -> AppResult<impl IntoResponse> {
    tracing::info!("currencies query");
    let url = "https://api.currencyapi.com/v3/currencies";
    let path = settings.data_dir.join("currencies.json");
    if path.exists() {
        let json = tokio::fs::read_to_string(&path).await?;
        let json = serde_json::from_str(&json)?;
        return Ok((StatusCode::OK, Json(json)));
    }
    let url = reqwest::Url::parse(url)?;
    let response = settings
        .client
        .get(url)
        .header("apikey", &settings.api_key)
        .send()
        .await?;
    if response.status() != 200 {
        tracing::error!("failed to fetch data: {:?}", response);
        return Err(anyhow::anyhow!("failed to fetch data"))?;
    }

    let json = response.json::<serde_json::Value>().await?;
    tokio::fs::write(&path, serde_json::to_string(&json)?).await?;
    Ok((StatusCode::OK, Json(json)))
}

#[axum_macros::debug_handler]
async fn latest(State(settings): State<Arc<Settings>>) -> AppResult<impl IntoResponse> {
    tracing::info!("latest query");
    let url = "https://api.currencyapi.com/v3/latest";
    let path = settings.data_dir.join("latest.json");
    if path.exists() {
        let json = tokio::fs::read_to_string(&path).await?;
        let json: serde_json::Value = serde_json::from_str(&json)?;
        let date = json["meta"]["last_updated_at"]
            .as_str()
            .context("meta.last_updated_at is mising in latest.json")?;
        let timestamp: Timestamp = date.parse()?;
        let timestamp = timestamp.to_zoned(TimeZone::UTC);
        let timstamp = timestamp.round(
            ZonedRound::new()
                .smallest(jiff::Unit::Day)
                .mode(jiff::RoundMode::Ceil),
        )?;
        let today = Timestamp::now().to_zoned(TimeZone::UTC).round(
            ZonedRound::new()
                .smallest(jiff::Unit::Day)
                .mode(jiff::RoundMode::Trunc),
        )?;
        if today == timstamp {
            return Ok((StatusCode::OK, Json(json)));
        }
    }
    let url = reqwest::Url::parse(url)?;
    let response = settings
        .client
        .get(url)
        .header("apikey", &settings.api_key)
        .send()
        .await?;
    if response.status() != 200 {
        tracing::error!("failed to fetch data: {:?}", response);
        return Err(anyhow::anyhow!("failed to fetch data"))?;
    }

    let json = response.json::<serde_json::Value>().await?;
    tokio::fs::write(&path, serde_json::to_string(&json)?).await?;
    Ok((StatusCode::OK, Json(json)))
}

#[derive(Debug, Deserialize)]
struct HistoricalQuery {
    date: String,
}

#[axum_macros::debug_handler]
async fn historical(
    State(settings): State<Arc<Settings>>,
    Query(query): Query<HistoricalQuery>,
) -> AppResult<impl IntoResponse> {
    tracing::info!("historical query: {:?}", query);
    let url = "https://api.currencyapi.com/v3/historical";
    let path = settings
        .data_dir
        .join(format!("historical_{}.json", query.date));
    if path.exists() {
        let json = tokio::fs::read_to_string(&path).await?;
        let json = serde_json::from_str(&json)?;
        return Ok((StatusCode::OK, Json(json)));
    }
    let url = reqwest::Url::parse_with_params(url, &[("date", &query.date)])?;
    let response = settings
        .client
        .get(url)
        .header("apikey", &settings.api_key)
        .send()
        .await?;
    if response.status() != 200 {
        tracing::error!("failed to fetch data: {:?}", response);
        return Err(anyhow::anyhow!("failed to fetch data"))?;
    }

    let json = response.json::<serde_json::Value>().await?;
    tokio::fs::write(&path, serde_json::to_string(&json)?).await?;
    Ok((StatusCode::OK, Json(json)))
}
