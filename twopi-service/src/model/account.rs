use migration::{AccountType, OnConflict};
use sea_orm::{prelude::Uuid, ActiveValue, DbConn, DbErr, EntityTrait, Linked, RelationTrait};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use validator::Validate;

use super::{
    category::CategoryModel,
    currency::CurrencyModel,
    transaction::{TransactionItemModel, TransactionWithAccount},
};
use crate::entity::{
    account::{ActiveModel, Column, Model},
    prelude::*,
};

#[derive(Clone, ToSchema, Serialize, Deserialize)]
pub struct AccountModel {
    id: Uuid,
    name: String,
    account_type: AccountType,
    currency_code: String,
    starting_balance: i64,
    created_at: chrono::DateTime<chrono::Utc>,
    #[schema(ignore)]
    account_extra: Option<serde_json::Value>,
}

#[derive(Clone, ToSchema, Serialize, Deserialize, Validate)]
pub struct NewAccountModel {
    id: Option<Uuid>,
    #[validate(length(min = 1, max = 100))]
    name: String,
    account_type: AccountType,
    #[validate(length(min = 3, max = 3))]
    currency_code: String,
    starting_balance: i64,
    created_at: chrono::DateTime<chrono::Utc>,
}

impl AccountModel {
    pub fn from_model(model: Model) -> Self {
        Self {
            id: model.id,
            name: model.name,
            #[allow(clippy::unwrap_used)]
            account_type: serde_json::from_str(&model.account_type).unwrap(),
            currency_code: model.currency_code,
            starting_balance: model.starting_balance,
            created_at: model.created_at,
            account_extra: model.account_extra,
        }
    }

    pub fn with_currency(self, currency: CurrencyModel) -> AccountWithCurrency {
        AccountWithCurrency {
            id: self.id,
            name: self.name,
            account_type: self.account_type,
            currency,
            starting_balance: self.starting_balance,
            created_at: self.created_at,
            account_extra: self.account_extra,
        }
    }

    pub async fn delete(db: &DbConn, id: Uuid) -> Result<(), DbErr> {
        Account::delete_by_id(id).exec(db).await?;
        Ok(())
    }

    pub async fn upsert(account: NewAccountModel, db: &DbConn) -> Result<Uuid, DbErr> {
        let result = Account::insert(ActiveModel {
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
            created_at: ActiveValue::Set(account.created_at),
            account_extra: ActiveValue::NotSet,
        })
        .on_conflict(
            OnConflict::column(Column::Id)
                .update_columns([
                    Column::Name,
                    Column::AccountType,
                    Column::CurrencyCode,
                    Column::StartingBalance,
                    Column::CreatedAt,
                    Column::AccountExtra,
                ])
                .to_owned(),
        )
        .exec(db)
        .await?;
        Ok(result.last_insert_id)
    }

    pub async fn upsert_many(accounts: Vec<NewAccountModel>, db: &DbConn) -> Result<(), DbErr> {
        Account::insert_many(accounts.into_iter().map(|a| ActiveModel {
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
            created_at: ActiveValue::Set(a.created_at),
            account_extra: ActiveValue::NotSet,
        }))
        .on_conflict(
            OnConflict::column(Column::Id)
                .update_columns([
                    Column::Name,
                    Column::AccountType,
                    Column::CurrencyCode,
                    Column::StartingBalance,
                    Column::CreatedAt,
                    Column::AccountExtra,
                ])
                .to_owned(),
        )
        .exec(db)
        .await?;
        Ok(())
    }
}

#[derive(Clone, ToSchema, Serialize, Deserialize)]
pub struct AccountWithCurrency {
    id: Uuid,
    name: String,
    account_type: AccountType,
    currency: CurrencyModel,
    starting_balance: i64,
    created_at: chrono::DateTime<chrono::Utc>,
    #[schema(ignore)]
    account_extra: Option<serde_json::Value>,
}

impl AccountWithCurrency {
    pub fn with_transactions(
        self,
        transactions: Vec<TransactionWithAccount>,
    ) -> AccountWithTransactions {
        AccountWithTransactions {
            id: self.id,
            name: self.name,
            account_type: self.account_type,
            currency: self.currency,
            starting_balance: self.starting_balance,
            created_at: self.created_at,
            account_extra: self.account_extra,
            transactions,
        }
    }

    pub async fn find_all(db: &DbConn) -> Result<Vec<Self>, DbErr> {
        Account::find()
            .find_also_related(Currency)
            .all(db)
            .await
            .map(|accounts| {
                accounts
                    .into_iter()
                    .map(|(a, c)| {
                        Some(
                            AccountModel::from_model(a)
                                .with_currency(CurrencyModel::from_model(c?)),
                        )
                    })
                    .collect::<Option<_>>()
                    .unwrap_or_default()
            })
    }
}

#[derive(ToSchema, Serialize, Deserialize)]
pub struct AccountWithTransactions {
    id: Uuid,
    name: String,
    account_type: AccountType,
    currency: CurrencyModel,
    starting_balance: i64,
    created_at: chrono::DateTime<chrono::Utc>,
    #[schema(ignore)]
    account_extra: Option<serde_json::Value>,
    transactions: Vec<TransactionWithAccount>,
}

pub struct AccountToTransaction;

impl Linked for AccountToTransaction {
    type FromEntity = Account;
    type ToEntity = Transaction;

    fn link(&self) -> Vec<sea_orm::LinkDef> {
        vec![
            crate::entity::transaction_item::Relation::Account
                .def()
                .rev(),
            crate::entity::transaction_item::Relation::Transaction.def(),
        ]
    }
}

impl AccountWithTransactions {
    pub async fn find_by_id(db: &DbConn, id: Uuid) -> Result<Option<Self>, DbErr> {
        let Some((account, transactions)) = Account::find_by_id(id)
            .find_with_linked(AccountToTransaction)
            .all(db)
            .await?
            .into_iter()
            .next()
        else {
            return Ok(None);
        };

        let Some(currency) = CurrencyModel::find_by_code(db, &account.currency_code).await? else {
            return Ok(None);
        };
        let account = AccountModel::from_model(account).with_currency(currency);
        let categories = CategoryModel::find_all(db).await?;

        let mut tx = vec![];
        for t in transactions {
            let Some((transaction, items)) = Transaction::find_by_id(t.id)
                .find_with_related(TransactionItem)
                .all(db)
                .await?
                .into_iter()
                .next()
            else {
                return Ok(None);
            };
            let items = items
                .into_iter()
                .map(|i| {
                    TransactionItemModel::new(
                        i.id,
                        i.notes,
                        i.transaction_id,
                        i.account_id,
                        i.category_id,
                        i.amount,
                    )
                    .with_category_and_account(
                        i.category_id
                            .and_then(|cid| categories.iter().find(|&c| c.id() == cid).cloned()),
                        account.clone(),
                    )
                })
                .collect();
            tx.push(
                TransactionWithAccount::new(
                    transaction.id,
                    transaction.title,
                    transaction.timestamp,
                )
                .with_items(items),
            );
        }

        Ok(Some(account.with_transactions(tx)))
    }
}
