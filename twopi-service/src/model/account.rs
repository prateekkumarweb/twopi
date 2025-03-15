use migration::{AccountType, OnConflict};
use sea_orm::{ActiveValue, DbConn, DbErr, EntityTrait, QueryOrder};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;
use validator::Validate;

use super::currency::{CurrencyEntity, CurrencyModel};
use crate::entity::account;

#[derive(Debug, Clone, ToSchema, Serialize, Deserialize)]
pub struct AccountModel(#[schema(inline)] pub account::Model);
pub type AccountEntity = account::Entity;
pub type AccountActiveModel = account::ActiveModel;
pub type AccountColumn = account::Column;

#[derive(Debug, Clone, ToSchema, Serialize, Deserialize, Validate)]
pub struct AccountReq {
    pub id: Option<Uuid>,
    #[validate(length(min = 1, max = 100))]
    name: String,
    account_type: AccountType,
    #[validate(length(min = 3, max = 3))]
    currency_code: String,
    starting_balance: i64,
    is_cash_flow: bool,
    is_active: bool,
    created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, ToSchema, Serialize, Deserialize)]
pub struct AccountExpandedModel {
    pub account: AccountModel,
    pub currency: CurrencyModel,
}

impl AccountReq {
    pub async fn find_all_with_currency(db: &DbConn) -> Result<Vec<AccountExpandedModel>, DbErr> {
        AccountEntity::find()
            .order_by_asc(AccountColumn::Name)
            .find_also_related(CurrencyEntity::default())
            .all(db)
            .await
            .map(|accounts| {
                accounts
                    .into_iter()
                    .map(|(a, c)| {
                        Some(AccountExpandedModel {
                            account: AccountModel(a),
                            currency: CurrencyModel(c?),
                        })
                    })
                    .collect::<Option<_>>()
                    .unwrap_or_default()
            })
    }

    pub async fn find_one_with_currency(
        db: &DbConn,
        id: Uuid,
    ) -> Result<Option<AccountExpandedModel>, DbErr> {
        AccountEntity::find_by_id(id)
            .find_also_related(CurrencyEntity::default())
            .one(db)
            .await
            .map(|account| {
                account
                    .and_then(|(a, c)| {
                        Some(AccountExpandedModel {
                            account: AccountModel(a),
                            currency: CurrencyModel(c?),
                        })
                    })
            })
    }

    pub async fn upsert(db: &DbConn, account: Self) -> Result<Uuid, DbErr> {
        let result = AccountEntity::insert(AccountActiveModel {
            id: ActiveValue::Set(account.id.unwrap_or_else(|| {
                Uuid::new_v7(uuid::Timestamp::from_unix(
                    uuid::timestamp::context::NoContext,
                    account.created_at.timestamp() as u64,
                    0,
                ))
            })),
            name: ActiveValue::Set(account.name),
            #[allow(clippy::unwrap_used)]
            account_type: ActiveValue::Set(serde_json::to_string(&account.account_type).unwrap()),
            currency_code: ActiveValue::Set(account.currency_code),
            starting_balance: ActiveValue::Set(account.starting_balance),
            is_cash_flow: ActiveValue::Set(account.is_cash_flow),
            is_active: ActiveValue::Set(account.is_active),
            created_at: ActiveValue::Set(account.created_at),
            account_extra: ActiveValue::NotSet,
        })
        .on_conflict(
            OnConflict::column(AccountColumn::Id)
                .update_columns([
                    AccountColumn::Name,
                    AccountColumn::AccountType,
                    AccountColumn::CurrencyCode,
                    AccountColumn::StartingBalance,
                    AccountColumn::IsCashFlow,
                    AccountColumn::IsActive,
                    AccountColumn::CreatedAt,
                    AccountColumn::AccountExtra,
                ])
                .to_owned(),
        )
        .exec(db)
        .await?;
        Ok(result.last_insert_id)
    }

    pub async fn upsert_many(db: &DbConn, accounts: Vec<Self>) -> Result<(), DbErr> {
        AccountEntity::insert_many(accounts.into_iter().map(|a| AccountActiveModel {
            id: ActiveValue::Set(a.id.unwrap_or_else(|| {
                Uuid::new_v7(uuid::Timestamp::from_unix(
                    uuid::timestamp::context::NoContext,
                    a.created_at.timestamp() as u64,
                    0,
                ))
            })),
            name: ActiveValue::Set(a.name),
            #[allow(clippy::unwrap_used)]
            account_type: ActiveValue::Set(serde_json::to_string(&a.account_type).unwrap()),
            currency_code: ActiveValue::Set(a.currency_code),
            starting_balance: ActiveValue::Set(a.starting_balance),
            is_cash_flow: ActiveValue::Set(a.is_cash_flow),
            is_active: ActiveValue::Set(a.is_active),
            created_at: ActiveValue::Set(a.created_at),
            account_extra: ActiveValue::NotSet,
        }))
        .on_conflict(
            OnConflict::column(AccountColumn::Id)
                .update_columns([
                    AccountColumn::Name,
                    AccountColumn::AccountType,
                    AccountColumn::CurrencyCode,
                    AccountColumn::StartingBalance,
                    AccountColumn::IsCashFlow,
                    AccountColumn::IsActive,
                    AccountColumn::CreatedAt,
                    AccountColumn::AccountExtra,
                ])
                .to_owned(),
        )
        .exec(db)
        .await?;
        Ok(())
    }

    pub async fn delete(db: &DbConn, id: Uuid) -> Result<(), DbErr> {
        AccountEntity::delete_by_id(id).exec(db).await?;
        Ok(())
    }
}
