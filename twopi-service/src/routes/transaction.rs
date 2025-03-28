use axum::{
    Json,
    extract::{Path, Query},
};
use sea_orm::prelude::Uuid;
use serde::Deserialize;
use utoipa::IntoParams;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::{
    AppError, AppResult, ValidatedJson, XUserId, database,
    model::transaction::{TransactionExpandedModel, TransactionReq},
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
    (status = OK, body = Vec<TransactionExpandedModel>),
    AppError
))]
async fn transaction(id: XUserId) -> AppResult<Json<Vec<TransactionExpandedModel>>> {
    let db = database(&id.0).await?;
    Ok(Json(TransactionReq::find_all_with_items(&db).await?))
}

#[tracing::instrument]
#[utoipa::path(get, path = "/{transaction_id}", params(("transaction_id" = Uuid, Path)), responses(
    (status = OK, body = Option<TransactionExpandedModel>),
    AppError
))]
async fn transaction_by_id(
    id: XUserId,
    Path(transaction_id): Path<Uuid>,
) -> AppResult<Json<Option<TransactionExpandedModel>>> {
    let db = database(&id.0).await?;
    Ok(Json(
        TransactionReq::find_one_with_items(&db, transaction_id).await?,
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
    TransactionReq::delete(&db, transaction_id).await?;
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
    TransactionReq::delete_item(&db, transaction_id).await?;
    Ok(())
}

#[tracing::instrument(skip(transaction))]
#[utoipa::path(put, path = "/",
    request_body = TransactionReq, responses(
    (status = OK, body = ()),
    AppError
))]
async fn put_transaction(
    id: XUserId,
    ValidatedJson(transaction): ValidatedJson<TransactionReq>,
) -> AppResult<()> {
    let db = database(&id.0).await?;
    TransactionReq::upsert(&db, transaction).await?;
    Ok(())
}

#[tracing::instrument(skip(transactions))]
#[utoipa::path(put, path = "/import",
    request_body = Vec<TransactionReq>, responses(
    (status = OK, body = ()),
    AppError
))]
async fn put_transactions(
    id: XUserId,
    ValidatedJson(transactions): ValidatedJson<Vec<TransactionReq>>,
) -> AppResult<()> {
    let db = database(&id.0).await?;
    TransactionReq::upsert_many(&db, transactions).await?;
    Ok(())
}
