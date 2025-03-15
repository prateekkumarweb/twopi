use std::sync::Arc;

use axum::{
    Json,
    extract::{Path, Query, State},
};
use serde::Deserialize;
use tokio::sync::Mutex;
use utoipa::IntoParams;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::{
    AppError, AppResult, ValidatedJson, XUserId,
    cache::CacheManager,
    database,
    model::v2::currency::{CurrencyModel, CurrencyReq},
};

pub fn router() -> OpenApiRouter<Arc<Mutex<CacheManager>>> {
    OpenApiRouter::new()
        .routes(routes![
            currency,
            post_currency,
            delete_currency,
            sync_currency
        ])
        .routes(routes![currency_by_id])
}

#[tracing::instrument]
#[utoipa::path(get, path = "/", responses(
    (status = OK, body = Vec<CurrencyModel>),
    AppError
))]
async fn currency(id: XUserId) -> AppResult<Json<Vec<CurrencyModel>>> {
    let db = database(&id.0).await?;
    Ok(Json(CurrencyReq::find_all(&db).await?))
}

#[tracing::instrument]
#[utoipa::path(get, path = "/{code}", params(("code" = String, Path)), responses(
    (status = OK, body = Option<CurrencyModel>),
    AppError
))]
async fn currency_by_id(
    id: XUserId,
    Path(code): Path<String>,
) -> AppResult<Json<Option<CurrencyModel>>> {
    let db = database(&id.0).await?;
    Ok(Json(CurrencyReq::find_one(&db, &code).await?))
}

#[derive(Deserialize, IntoParams)]
struct DeleteCurrencyParams {
    #[into_params(names("code"), parameter_in = Query)]
    code: String,
}

#[tracing::instrument]
#[utoipa::path(delete, path = "/", params(DeleteCurrencyParams), responses(
    (status = OK, body = ()),
    AppError
))]
async fn delete_currency(
    id: XUserId,
    Query(DeleteCurrencyParams { code }): Query<DeleteCurrencyParams>,
) -> AppResult<()> {
    let db = database(&id.0).await?;
    CurrencyReq::delete(&db, &code).await?;
    Ok(())
}

#[tracing::instrument(skip(currency))]
#[utoipa::path(post, path = "/",
    request_body = CurrencyModel, responses(
    (status = OK, body = ()), AppError
))]
async fn post_currency(
    id: XUserId,
    ValidatedJson(currency): ValidatedJson<CurrencyReq>,
) -> AppResult<()> {
    let db = database(&id.0).await?;
    CurrencyReq::upsert(&db, currency).await?;
    Ok(())
}

#[tracing::instrument(skip(cache))]
#[utoipa::path(put, path = "/sync", responses(
    (status = OK, body = ()),
    AppError
))]
async fn sync_currency(
    id: XUserId,
    State(cache): State<Arc<Mutex<CacheManager>>>,
) -> AppResult<()> {
    let db = database(&id.0).await?;
    tracing::info!("Syncing currency for {}", id.0);
    let currencies = cache
        .lock()
        .await
        .currencies()
        .await
        .map_err(AppError::Other)?;
    let currencies = currencies
        .data
        .values()
        .filter(|c| c.type_ == "fiat")
        .map(|c| CurrencyReq {
            code: c.code.clone(),
            name: c.name.clone(),
            decimal_digits: c.decimal_digits,
        })
        .collect();
    CurrencyReq::upsert_many(&db, currencies).await?;
    Ok(())
}
