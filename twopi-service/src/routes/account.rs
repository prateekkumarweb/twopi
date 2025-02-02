use std::collections::HashMap;

use axum::{
    extract::{Path, Query},
    response::IntoResponse,
    Json,
};
use axum_extra::TypedHeader;
use migration::{AccountType, OnConflict};
use reqwest::StatusCode;
use sea_orm::{
    prelude::Uuid, ActiveValue, ColumnTrait, EntityTrait, Linked, QueryFilter, QueryOrder,
    RelationTrait, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::{database, entity, AppError, AppResult, XUserId};

use super::{
    currency::Currency,
    transaction::{Transaction, TransactionItem},
};

pub fn router() -> OpenApiRouter<()> {
    OpenApiRouter::new()
        .routes(routes![account, put_account, delete_account])
        .routes(routes![put_accounts])
        .routes(routes![account_by_id])
}

#[derive(ToSchema, Serialize, Deserialize)]
pub struct Account {
    pub id: Uuid,
    pub name: String,
    pub account_type: AccountType,
    pub currency_code: String,
    pub starting_balance: i64,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub account_extra: Option<serde_json::Value>,
    pub currency: Option<Currency>,
    pub transactions: Option<Vec<Transaction>>,
}

#[axum::debug_handler]
#[utoipa::path(get, path = "/", params(XUserId), responses(
    (status = OK, body = Vec<Account>),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn account(TypedHeader(id): TypedHeader<XUserId>) -> AppResult<impl IntoResponse> {
    let db = database(&id.0).await?;
    tracing::info!("Querying Account for {}", id.0);
    let accounts = entity::account::Entity::find()
        .order_by_asc(entity::account::Column::Name)
        .find_also_related(entity::currency::Entity)
        .all(&db)
        .await
        .map_err(|err| AppError::DbErr(err))?;
    Ok(Json(
        accounts
            .into_iter()
            .map(|(a, c)| -> AppResult<Account> {
                Ok(Account {
                    id: a.id,
                    name: a.name,
                    account_type: serde_json::from_str::<AccountType>(&a.account_type)
                        .map_err(|err| AppError::Other(err.into()))?,
                    currency_code: a.currency_code,
                    starting_balance: a.starting_balance,
                    created_at: a.created_at,
                    account_extra: a.account_extra,
                    currency: c.map(|c| Currency {
                        code: c.code,
                        name: c.name,
                        decimal_digits: c.decimal_digits,
                    }),
                    transactions: None,
                })
            })
            .collect::<AppResult<Vec<_>>>()?,
    ))
}

struct AccountToTransaction;

impl Linked for AccountToTransaction {
    type FromEntity = entity::account::Entity;
    type ToEntity = entity::transaction::Entity;

    fn link(&self) -> Vec<sea_orm::LinkDef> {
        vec![
            entity::transaction_item::Relation::Account.def().rev(),
            entity::transaction_item::Relation::Transaction.def(),
        ]
    }
}

#[axum::debug_handler]
#[utoipa::path(get, path = "/{account_id}", params(XUserId, ("account_id" = Uuid, Path)), responses(
    (status = OK, body = Account),
    (status = NOT_FOUND),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn account_by_id(
    TypedHeader(id): TypedHeader<XUserId>,
    Path(account_id): Path<Uuid>,
) -> AppResult<impl IntoResponse> {
    let db = database(&id.0).await?;
    tracing::info!("Querying currency for {}", id.0);
    let Some((account, transactions)) = entity::account::Entity::find_by_id(account_id)
        .find_also_linked(AccountToTransaction)
        .one(&db)
        .await
        .map_err(|err| AppError::DbErr(err))?
    else {
        return Ok(StatusCode::NOT_FOUND.into_response());
    };
    let currencies = entity::currency::Entity::find()
        .all(&db)
        .await
        .map_err(|err| AppError::DbErr(err))?
        .into_iter()
        .map(|c| (c.code.clone(), c))
        .collect::<HashMap<_, _>>();
    let mut transactions = transactions
        .into_iter()
        .map(|t| Transaction {
            id: t.id,
            title: t.title,
            timestamp: t.timestamp,
            transaction_items: None,
        })
        .collect::<Vec<_>>();
    for transaction in transactions.iter_mut() {
        transaction.transaction_items = Some(
            entity::transaction_item::Entity::find()
                .filter(entity::transaction_item::Column::TransactionId.eq(transaction.id))
                .all(&db)
                .await
                .map_err(|err| AppError::DbErr(err))?
                .into_iter()
                .map(|ti| TransactionItem {
                    id: ti.id,
                    notes: ti.notes,
                    account_id: ti.account_id,
                    amount: ti.amount,
                    transaction_id: ti.transaction_id,
                    category_id: ti.category_id,
                    account: None,
                })
                .collect::<Vec<_>>(),
        )
    }
    let account = Account {
        id: account.id,
        name: account.name,
        account_type: serde_json::from_str::<AccountType>(&account.account_type)
            .map_err(|err| AppError::Other(err.into()))?,
        starting_balance: account.starting_balance,
        created_at: account.created_at,
        account_extra: account.account_extra,
        currency: currencies.get(&account.currency_code).map(|c| Currency {
            code: c.code.clone(),
            name: c.name.clone(),
            decimal_digits: c.decimal_digits,
        }),
        currency_code: account.currency_code,
        transactions: Some(transactions),
    };

    Ok(Json(account).into_response())
}

#[derive(Deserialize, IntoParams)]
struct DeleteAccountParams {
    #[into_params(names("id"), parameter_in = Query)]
    id: Uuid,
}

#[axum::debug_handler]
#[utoipa::path(delete, path = "/", params(XUserId, DeleteAccountParams), responses(
    (status = OK, body = ()),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn delete_account(
    TypedHeader(id): TypedHeader<XUserId>,
    Query(DeleteAccountParams { id: account_id }): Query<DeleteAccountParams>,
) -> AppResult<impl IntoResponse> {
    let db = database(&id.0).await?;
    tracing::info!("Querying Account for {}", id.0);
    entity::account::Entity::delete(entity::account::ActiveModel {
        id: ActiveValue::Set(account_id),
        ..Default::default()
    })
    .exec(&db)
    .await
    .map_err(|err| AppError::DbErr(err))?;
    Ok(())
}

#[axum::debug_handler]
#[utoipa::path(put, path = "/", params(XUserId),
    request_body = Account, responses(
    (status = OK, body = String),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn put_account(
    TypedHeader(id): TypedHeader<XUserId>,
    Json(account): Json<Account>,
) -> AppResult<impl IntoResponse> {
    let db = database(&id.0).await?;
    tracing::info!("Querying Account for {}", id.0);
    let account = entity::account::Entity::insert(entity::account::ActiveModel {
        id: ActiveValue::Set(account.id),
        name: ActiveValue::Set(account.name.trim().to_owned()),
        account_type: ActiveValue::Set(
            serde_json::to_string(&account.account_type)
                .map_err(|err| AppError::Other(err.into()))?,
        ),
        currency_code: ActiveValue::Set(account.currency_code),
        starting_balance: ActiveValue::Set(account.starting_balance),
        created_at: ActiveValue::Set(account.created_at),
        account_extra: ActiveValue::Set(account.account_extra),
    })
    .on_conflict(
        OnConflict::column(entity::account::Column::Id)
            .update_columns([
                entity::account::Column::Name,
                entity::account::Column::AccountType,
                entity::account::Column::CurrencyCode,
                entity::account::Column::StartingBalance,
                entity::account::Column::CreatedAt,
                entity::account::Column::AccountExtra,
            ])
            .to_owned(),
    )
    .exec(&db)
    .await
    .map_err(|err| AppError::DbErr(err))?;
    Ok(Json(account.last_insert_id))
}

#[axum::debug_handler]
#[utoipa::path(put, path = "/import", params(XUserId),
    request_body = Vec<Account>, responses(
    (status = OK, body = Vec<String>),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn put_accounts(
    TypedHeader(id): TypedHeader<XUserId>,
    Json(accounts): Json<Vec<Account>>,
) -> AppResult<impl IntoResponse> {
    let db = database(&id.0).await?;
    tracing::info!("Querying Account for {}", id.0);
    let ids = db
        .transaction::<_, _, AppError>(|txn| {
            Box::pin(async move {
                let mut ids = Vec::new();
                for account in accounts.iter() {
                    let account = entity::account::Entity::insert(entity::account::ActiveModel {
                        id: ActiveValue::Set(account.id),
                        name: ActiveValue::Set(account.name.trim().to_owned()),
                        account_type: ActiveValue::Set(
                            serde_json::to_string(&account.account_type)
                                .map_err(|err| AppError::Other(err.into()))?,
                        ),
                        currency_code: ActiveValue::Set(account.currency_code.clone()),
                        starting_balance: ActiveValue::Set(account.starting_balance),
                        created_at: ActiveValue::Set(account.created_at),
                        account_extra: ActiveValue::Set(account.account_extra.clone()),
                    })
                    .on_conflict(
                        OnConflict::column(entity::account::Column::Id)
                            .update_columns([
                                entity::account::Column::Name,
                                entity::account::Column::AccountType,
                                entity::account::Column::CurrencyCode,
                                entity::account::Column::StartingBalance,
                                entity::account::Column::CreatedAt,
                                entity::account::Column::AccountExtra,
                            ])
                            .to_owned(),
                    )
                    .exec(txn)
                    .await
                    .map_err(|err| AppError::DbErr(err))?;
                    ids.push(account.last_insert_id);
                }
                Ok(ids)
            })
        })
        .await
        .map_err(|err| AppError::Other(err.into()))?;
    Ok(Json(ids))
}
