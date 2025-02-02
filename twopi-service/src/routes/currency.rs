use std::sync::Arc;

use axum::{
    extract::{Path, Query, State},
    response::IntoResponse,
    Json,
};
use axum_extra::TypedHeader;
use migration::OnConflict;
use reqwest::StatusCode;
use sea_orm::{ActiveValue, EntityTrait, QueryOrder};
use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;
use utoipa::{IntoParams, ToSchema};
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::{cache::CacheManager, database, entity, AppError, AppResult, XUserId};

pub fn router() -> OpenApiRouter<Arc<Mutex<CacheManager>>> {
    OpenApiRouter::new()
        .routes(routes![
            currency,
            put_currency,
            delete_currency,
            sync_currency
        ])
        .routes(routes![currency_by_id])
}

#[derive(ToSchema, Serialize, Deserialize)]
pub struct Currency {
    pub code: String,
    pub name: String,
    pub decimal_digits: i32,
}

#[axum::debug_handler]
#[utoipa::path(get, path = "/", params(XUserId), responses(
    (status = OK, body = Vec<Currency>),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn currency(TypedHeader(id): TypedHeader<XUserId>) -> AppResult<impl IntoResponse> {
    let db = database(&id.0).await?;
    tracing::info!("Querying currency for {}", id.0);
    let currency = entity::currency::Entity::find()
        .order_by_asc(entity::currency::Column::Code)
        .all(&db)
        .await
        .map_err(|err| AppError::DbErr(err))?;
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
#[utoipa::path(get, path = "/{code}", params(XUserId, ("code" = String, Path)), responses(
    (status = OK, body = Currency),
    (status = NOT_FOUND),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn currency_by_id(
    TypedHeader(id): TypedHeader<XUserId>,
    Path(code): Path<String>,
) -> AppResult<impl IntoResponse> {
    let db = database(&id.0).await?;
    tracing::info!("Querying currency for {}", id.0);
    let Some(currency) = entity::currency::Entity::find_by_id(code)
        .one(&db)
        .await
        .map_err(|err| AppError::DbErr(err))?
    else {
        return Ok(StatusCode::NOT_FOUND.into_response());
    };
    Ok(Json(Currency {
        code: currency.code,
        name: currency.name,
        decimal_digits: currency.decimal_digits,
    })
    .into_response())
}

#[derive(Deserialize, IntoParams)]
struct DeleteCurrencyParams {
    #[into_params(names("code"), parameter_in = Query)]
    code: String,
}

#[axum::debug_handler]
#[utoipa::path(delete, path = "/", params(XUserId, DeleteCurrencyParams), responses(
    (status = OK, body = ()),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn delete_currency(
    TypedHeader(id): TypedHeader<XUserId>,
    Query(DeleteCurrencyParams { code }): Query<DeleteCurrencyParams>,
) -> AppResult<impl IntoResponse> {
    let db = database(&id.0).await?;
    tracing::info!("Querying currency for {}", id.0);
    entity::currency::Entity::delete(entity::currency::ActiveModel {
        code: ActiveValue::Set(code),
        ..Default::default()
    })
    .exec(&db)
    .await
    .map_err(|err| AppError::DbErr(err))?;
    Ok(())
}

#[axum::debug_handler]
#[utoipa::path(put, path = "/", params(XUserId),
    request_body = Currency, responses(
    (status = OK, body = Currency),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn put_currency(
    TypedHeader(id): TypedHeader<XUserId>,
    Json(currency): Json<Currency>,
) -> AppResult<impl IntoResponse> {
    let db = database(&id.0).await?;
    tracing::info!("Querying currency for {}", id.0);
    entity::currency::Entity::insert(entity::currency::ActiveModel {
        code: ActiveValue::Set(currency.code.clone()),
        name: ActiveValue::Set(currency.name.clone()),
        decimal_digits: ActiveValue::Set(currency.decimal_digits),
    })
    .on_conflict(
        OnConflict::column(entity::currency::Column::Code)
            .update_columns([
                entity::currency::Column::Name,
                entity::currency::Column::DecimalDigits,
            ])
            .to_owned(),
    )
    .exec(&db)
    .await
    .map_err(|err| AppError::DbErr(err))?;
    Ok(Json(currency))
}

#[axum::debug_handler]
#[utoipa::path(post, path = "/sync", params(XUserId), responses(
    (status = OK, body = ()),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn sync_currency(
    TypedHeader(id): TypedHeader<XUserId>,
    State(cache): State<Arc<Mutex<CacheManager>>>,
) -> AppResult<()> {
    let db = database(&id.0).await?;
    tracing::info!("Syncing currency for {}", id.0);
    let currencies = cache
        .lock()
        .await
        .currencies()
        .await
        .map_err(|err| AppError::Other(err))?;
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
            .await
            .map_err(|err| AppError::DbErr(err))?;
    }
    Ok(())
}
