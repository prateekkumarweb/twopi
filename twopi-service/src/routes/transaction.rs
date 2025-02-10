use axum::{
    extract::{Path, Query},
    Json,
};
use sea_orm::prelude::Uuid;
use serde::Deserialize;
use utoipa::IntoParams;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::{
    database,
    model::transaction::{
        NewTransactionModel, TransactionItemModel, TransactionModel, TransactionWithAccount,
    },
    AppError, AppResult, XUserId,
};

pub fn router() -> OpenApiRouter<()> {
    OpenApiRouter::new()
        .routes(routes![transaction, put_transaction, delete_transaction])
        .routes(routes![put_transactions])
        .routes(routes![transaction_by_id])
        .routes(routes![delete_transaction_item])
}

#[tracing::instrument]
#[utoipa::path(get, path = "/", responses(
    (status = OK, body = Vec<TransactionWithAccount>),
    AppError
))]
async fn transaction(id: XUserId) -> AppResult<Json<Vec<TransactionWithAccount>>> {
    let db = database(&id.0).await?;
    tracing::info!("Querying Transaction for {}", id.0);
    Ok(Json(TransactionModel::find_all(&db).await?))
}

#[tracing::instrument]
#[utoipa::path(get, path = "/{transaction_id}", params(("transaction_id" = Uuid, Path)), responses(
    (status = OK, body = Option<TransactionWithAccount>),
    AppError
))]
async fn transaction_by_id(
    id: XUserId,
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

#[tracing::instrument]
#[utoipa::path(delete, path = "/", params(DeleteTransactionParams), responses(
    (status = OK, body = ()),
    AppError
))]
async fn delete_transaction(
    id: XUserId,
    Query(DeleteTransactionParams { id: transaction_id }): Query<DeleteTransactionParams>,
) -> AppResult<()> {
    let db = database(&id.0).await?;
    TransactionModel::delete(&db, transaction_id).await?;
    Ok(())
}

#[tracing::instrument]
#[utoipa::path(delete, path = "/item", params(DeleteTransactionParams), responses(
    (status = OK, body = ()),
    AppError
))]
async fn delete_transaction_item(
    id: XUserId,
    Query(DeleteTransactionParams { id: transaction_id }): Query<DeleteTransactionParams>,
) -> AppResult<()> {
    let db = database(&id.0).await?;
    TransactionItemModel::delete(&db, transaction_id).await?;
    Ok(())
}

#[tracing::instrument(skip(transaction))]
#[utoipa::path(put, path = "/",
    request_body = NewTransactionModel, responses(
    (status = OK, body = ()),
    AppError
))]
async fn put_transaction(
    id: XUserId,
    Json(transaction): Json<NewTransactionModel>,
) -> AppResult<()> {
    let db = database(&id.0).await?;
    TransactionModel::upsert(transaction, &db).await?;
    Ok(())
}

#[tracing::instrument(skip(transactions))]
#[utoipa::path(put, path = "/import",
    request_body = Vec<NewTransactionModel>, responses(
    (status = OK, body = ()),
    AppError
))]
async fn put_transactions(
    id: XUserId,
    Json(transactions): Json<Vec<NewTransactionModel>>,
) -> AppResult<()> {
    let db = database(&id.0).await?;
    TransactionModel::upsert_many(transactions, &db).await?;
    Ok(())
}
