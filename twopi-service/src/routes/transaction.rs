use axum::{
    extract::{Path, Query},
    response::IntoResponse,
    Json,
};
use axum_extra::TypedHeader;
use migration::OnConflict;
use reqwest::StatusCode;
use sea_orm::{prelude::Uuid, ActiveValue, EntityTrait, QueryOrder, TransactionTrait};
use serde::Deserialize;
use utoipa::IntoParams;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::{
    database, entity,
    model::transaction::{TransactionItemModel, TransactionModel},
    AppError, AppResult, XUserId,
};

pub fn router() -> OpenApiRouter<()> {
    OpenApiRouter::new()
        .routes(routes![transaction, put_transaction, delete_transaction])
        .routes(routes![put_transactions])
        .routes(routes![transaction_by_id])
}

#[axum::debug_handler]
#[utoipa::path(get, path = "/", params(XUserId), responses(
    (status = OK, body = Vec<TransactionModel>),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn transaction(TypedHeader(id): TypedHeader<XUserId>) -> AppResult<impl IntoResponse> {
    let db = database(&id.0).await?;
    tracing::info!("Querying Transaction for {}", id.0);
    let transactions = entity::prelude::Transaction::find()
        .order_by_asc(entity::transaction::Column::Timestamp)
        .find_with_related(entity::prelude::TransactionItem)
        .all(&db)
        .await
        .map_err(|err| AppError::DbErr(err))?;
    Ok(Json(
        transactions
            .into_iter()
            .map(|(t, items)| TransactionModel {
                id: t.id,
                title: t.title,
                timestamp: t.timestamp,
                transaction_items: Some(
                    items
                        .into_iter()
                        .map(|item| TransactionItemModel {
                            id: item.id,
                            notes: item.notes,
                            transaction_id: item.transaction_id,
                            account_id: item.account_id,
                            category_id: item.category_id,
                            amount: item.amount,
                        })
                        .collect(),
                ),
            })
            .collect::<Vec<_>>(),
    ))
}

#[axum::debug_handler]
#[utoipa::path(get, path = "/{transaction_id}", params(XUserId, ("transaction_id" = Uuid, Path)), responses(
    (status = OK, body = TransactionModel),
    (status = NOT_FOUND),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn transaction_by_id(
    TypedHeader(id): TypedHeader<XUserId>,
    Path(transaction_id): Path<Uuid>,
) -> AppResult<impl IntoResponse> {
    let db = database(&id.0).await?;
    tracing::info!("Querying transaction for {}", id.0);
    let Some((transaction, items)) = entity::prelude::Transaction::find_by_id(transaction_id)
        .find_also_related(entity::prelude::TransactionItem)
        .one(&db)
        .await
        .map_err(|err| AppError::DbErr(err))?
    else {
        return Ok(StatusCode::NOT_FOUND.into_response());
    };
    Ok(Json(TransactionModel {
        id: transaction.id,
        title: transaction.title,
        timestamp: transaction.timestamp,
        transaction_items: Some(
            items
                .into_iter()
                .map(|item| TransactionItemModel {
                    id: item.id,
                    notes: item.notes,
                    transaction_id: item.transaction_id,
                    account_id: item.account_id,
                    category_id: item.category_id,
                    amount: item.amount,
                })
                .collect(),
        ),
    })
    .into_response())
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
) -> AppResult<impl IntoResponse> {
    let db = database(&id.0).await?;
    tracing::info!("Querying Transaction for {}", id.0);
    entity::prelude::Transaction::delete(entity::transaction::ActiveModel {
        id: ActiveValue::Set(transaction_id),
        ..Default::default()
    })
    .exec(&db)
    .await
    .map_err(|err| AppError::DbErr(err))?;
    Ok(())
}

#[axum::debug_handler]
#[utoipa::path(put, path = "/", params(XUserId),
    request_body = TransactionModel, responses(
    (status = OK, body = String),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn put_transaction(
    TypedHeader(id): TypedHeader<XUserId>,
    Json(transaction): Json<TransactionModel>,
) -> AppResult<impl IntoResponse> {
    let db = database(&id.0).await?;
    tracing::info!("Querying Transaction for {}", id.0);
    let transaction = db
        .transaction::<_, _, AppError>(|txn| {
            Box::pin(async move {
                let transaction_model =
                    entity::prelude::Transaction::insert(entity::transaction::ActiveModel {
                        id: ActiveValue::Set(transaction.id),
                        title: ActiveValue::Set(transaction.title.trim().to_owned()),
                        timestamp: ActiveValue::Set(transaction.timestamp),
                    })
                    .on_conflict(
                        OnConflict::column(entity::transaction::Column::Id)
                            .update_columns([
                                entity::transaction::Column::Title,
                                entity::transaction::Column::Timestamp,
                            ])
                            .to_owned(),
                    )
                    .exec(txn)
                    .await
                    .map_err(|err| AppError::DbErr(err))?;

                for item in transaction
                    .transaction_items
                    .unwrap_or_else(|| vec![])
                    .iter()
                {
                    entity::prelude::TransactionItem::insert(
                        entity::transaction_item::ActiveModel {
                            id: ActiveValue::Set(item.id),
                            notes: ActiveValue::Set(item.notes.trim().to_owned()),
                            transaction_id: ActiveValue::Set(item.transaction_id),
                            account_id: ActiveValue::Set(item.account_id),
                            category_id: ActiveValue::Set(item.category_id),
                            amount: ActiveValue::Set(item.amount),
                        },
                    )
                    .on_conflict(
                        OnConflict::column(entity::transaction_item::Column::Id)
                            .update_columns([
                                entity::transaction_item::Column::Notes,
                                entity::transaction_item::Column::TransactionId,
                                entity::transaction_item::Column::AccountId,
                                entity::transaction_item::Column::CategoryId,
                                entity::transaction_item::Column::Amount,
                            ])
                            .to_owned(),
                    )
                    .exec(txn)
                    .await
                    .map_err(|err| AppError::DbErr(err))?;
                }

                Ok(transaction_model.last_insert_id)
            })
        })
        .await
        .map_err(|err| AppError::Other(err.into()))?;
    Ok(Json(transaction))
}

#[axum::debug_handler]
#[utoipa::path(put, path = "/import", params(XUserId),
    request_body = Vec<TransactionModel>, responses(
    (status = OK, body = Vec<String>),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn put_transactions(
    TypedHeader(id): TypedHeader<XUserId>,
    Json(transactions): Json<Vec<TransactionModel>>,
) -> AppResult<impl IntoResponse> {
    let db = database(&id.0).await?;
    tracing::info!("Querying Transaction for {}", id.0);
    let ids = db
        .transaction::<_, _, AppError>(|txn| {
            Box::pin(async move {
                let mut ids = Vec::new();
                for transaction in transactions.iter() {
                    let transaction_model =
                        entity::prelude::Transaction::insert(entity::transaction::ActiveModel {
                            id: ActiveValue::Set(transaction.id),
                            title: ActiveValue::Set(transaction.title.trim().to_owned()),
                            timestamp: ActiveValue::Set(transaction.timestamp),
                        })
                        .on_conflict(
                            OnConflict::column(entity::transaction::Column::Id)
                                .update_columns([
                                    entity::transaction::Column::Title,
                                    entity::transaction::Column::Timestamp,
                                ])
                                .to_owned(),
                        )
                        .exec(txn)
                        .await
                        .map_err(|err| AppError::DbErr(err))?;

                    if let Some(transaction_items) = &transaction.transaction_items {
                        for item in transaction_items.iter() {
                            entity::prelude::TransactionItem::insert(
                                entity::transaction_item::ActiveModel {
                                    id: ActiveValue::Set(item.id),
                                    notes: ActiveValue::Set(item.notes.trim().to_owned()),
                                    transaction_id: ActiveValue::Set(item.transaction_id),
                                    account_id: ActiveValue::Set(item.account_id),
                                    category_id: ActiveValue::Set(item.category_id),
                                    amount: ActiveValue::Set(item.amount),
                                },
                            )
                            .on_conflict(
                                OnConflict::column(entity::transaction_item::Column::Id)
                                    .update_columns([
                                        entity::transaction_item::Column::Notes,
                                        entity::transaction_item::Column::TransactionId,
                                        entity::transaction_item::Column::AccountId,
                                        entity::transaction_item::Column::CategoryId,
                                        entity::transaction_item::Column::Amount,
                                    ])
                                    .to_owned(),
                            )
                            .exec(txn)
                            .await
                            .map_err(|err| AppError::DbErr(err))?;
                        }
                    }

                    ids.push(transaction_model.last_insert_id);
                }
                Ok(ids)
            })
        })
        .await
        .map_err(|err| AppError::Other(err.into()))?;
    Ok(Json(ids))
}
