use axum::{
    extract::{Path, Query},
    Json,
};
use axum_extra::TypedHeader;
use sea_orm::prelude::Uuid;
use serde::Deserialize;
use utoipa::IntoParams;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::{
    database,
    model::transaction::{TransactionItemModel, TransactionModel, TransactionWithAccount},
    AppResult, XUserId,
};

pub fn router() -> OpenApiRouter<()> {
    OpenApiRouter::new()
        .routes(routes![transaction, put_transaction, delete_transaction])
        .routes(routes![put_transactions])
        .routes(routes![transaction_by_id])
        .routes(routes![delete_transaction_item])
}

#[axum::debug_handler]
#[utoipa::path(get, path = "/", params(XUserId), responses(
    (status = OK, body = Vec<TransactionWithAccount>),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn transaction(
    TypedHeader(id): TypedHeader<XUserId>,
) -> AppResult<Json<Vec<TransactionWithAccount>>> {
    let db = database(&id.0).await?;
    tracing::info!("Querying Transaction for {}", id.0);
    Ok(Json(TransactionModel::find_all(&db).await?))
}

#[axum::debug_handler]
#[utoipa::path(get, path = "/{transaction_id}", params(XUserId, ("transaction_id" = Uuid, Path)), responses(
    (status = OK, body = Option<TransactionWithAccount>),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn transaction_by_id(
    TypedHeader(id): TypedHeader<XUserId>,
    Path(transaction_id): Path<Uuid>,
) -> AppResult<Json<Option<TransactionWithAccount>>> {
    let db = database(&id.0).await?;
    Ok(Json(
        TransactionModel::find_by_id(&db, transaction_id).await?,
    ))
}

#[derive(Deserialize, IntoParams)]
struct DeleteTransactionParams {
    #[into_params(names("id"), parameter_in = Query)]
    id: Uuid,
}

#[axum::debug_handler]
#[utoipa::path(delete, path = "/", params(XUserId, DeleteTransactionParams), responses(
    (status = OK, body = ()),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn delete_transaction(
    TypedHeader(id): TypedHeader<XUserId>,
    Query(DeleteTransactionParams { id: transaction_id }): Query<DeleteTransactionParams>,
) -> AppResult<()> {
    let db = database(&id.0).await?;
    TransactionModel::delete(&db, transaction_id).await?;
    Ok(())
}

#[axum::debug_handler]
#[utoipa::path(delete, path = "/item", params(XUserId, DeleteTransactionParams), responses(
    (status = OK, body = ()),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn delete_transaction_item(
    TypedHeader(id): TypedHeader<XUserId>,
    Query(DeleteTransactionParams { id: transaction_id }): Query<DeleteTransactionParams>,
) -> AppResult<()> {
    let db = database(&id.0).await?;
    TransactionItemModel::delete(&db, transaction_id).await?;
    Ok(())
}

#[axum::debug_handler]
#[utoipa::path(put, path = "/", params(XUserId),
    request_body = TransactionModel, responses(
    (status = OK, body = ()),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn put_transaction(
    TypedHeader(id): TypedHeader<XUserId>,
    Json(transaction): Json<TransactionModel>,
) -> AppResult<()> {
    let db = database(&id.0).await?;
    transaction.upsert(&db).await?;
    Ok(())
}

#[axum::debug_handler]
#[utoipa::path(put, path = "/import", params(XUserId),
    request_body = Vec<TransactionModel>, responses(
    (status = OK, body = ()),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn put_transactions(
    TypedHeader(id): TypedHeader<XUserId>,
    Json(transactions): Json<Vec<TransactionModel>>,
) -> AppResult<()> {
    let db = database(&id.0).await?;
    TransactionModel::upsert_many(transactions, &db).await?;
    Ok(())
}
