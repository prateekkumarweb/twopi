use std::collections::HashMap;

use migration::OnConflict;
use sea_orm::{
    prelude::Uuid, ActiveValue, ColumnTrait, DbConn, DbErr, EntityTrait, QueryFilter,
    TransactionTrait,
};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use super::{
    account::{AccountModel, AccountWithCurrency},
    category::CategoryModel,
    currency::CurrencyModel,
};
use crate::entity::{
    prelude::*,
    transaction::{ActiveModel, Column},
    transaction_item,
};

#[derive(ToSchema, Serialize, Deserialize)]
pub struct TransactionModel {
    id: Uuid,
    title: String,
    timestamp: chrono::DateTime<chrono::Utc>,
    transaction_items: Vec<TransactionItemModel>,
}

#[derive(ToSchema, Serialize, Deserialize)]
pub struct TransactionItemModel {
    pub id: Uuid,
    pub notes: String,
    pub transaction_id: Uuid,
    pub account_id: Uuid,
    pub category_id: Option<Uuid>,
    pub amount: i64,
}

impl TransactionModel {
    pub async fn find_all(db: &DbConn) -> Result<Vec<TransactionWithAccount>, DbErr> {
        let transactions = Transaction::find()
            .find_with_related(TransactionItem)
            .all(db)
            .await?;
        let accounts = Account::find()
            .all(db)
            .await?
            .into_iter()
            .map(|m| (m.id, m))
            .collect::<HashMap<_, _>>();
        let currencies = Currency::find()
            .all(db)
            .await?
            .into_iter()
            .map(|c| (c.code.clone(), c))
            .collect::<HashMap<_, _>>();
        let categories = Category::find()
            .all(db)
            .await?
            .into_iter()
            .map(|c| (c.id, c))
            .collect::<HashMap<_, _>>();

        Ok(transactions
            .into_iter()
            .map(|(t, items)| {
                Some(TransactionWithAccount {
                    id: t.id,
                    title: t.title,
                    timestamp: t.timestamp,
                    transaction_items: items
                        .into_iter()
                        .map(|item| {
                            Some(TransactionItemWithAccount {
                                id: item.id,
                                notes: item.notes,
                                transaction_id: item.transaction_id,
                                amount: item.amount,
                                account: accounts.get(&item.account_id).cloned().and_then(|a| {
                                    let c = a.currency_code.clone();
                                    Some(AccountModel::from_model(a).with_currency(
                                        CurrencyModel::from_model(currencies.get(&c).cloned()?),
                                    ))
                                })?,
                                category: item.category_id.and_then(|cid| {
                                    categories
                                        .get(&cid)
                                        .cloned()
                                        .map(|c| CategoryModel::new(c.id, c.name, c.group, c.icon))
                                }),
                            })
                        })
                        .collect::<Option<_>>()?,
                })
            })
            .collect::<Option<_>>()
            .unwrap_or_default())
    }

    pub async fn find_by_id(
        db: &DbConn,
        id: Uuid,
    ) -> Result<Option<TransactionWithAccount>, DbErr> {
        let Some((transaction, items)) = Transaction::find_by_id(id)
            .find_with_related(TransactionItem)
            .all(db)
            .await?
            .into_iter()
            .next()
        else {
            return Ok(None);
        };

        let accounts = Account::find()
            .all(db)
            .await?
            .into_iter()
            .map(|m| (m.id, m))
            .collect::<HashMap<_, _>>();
        let currencies = Currency::find()
            .all(db)
            .await?
            .into_iter()
            .map(|c| (c.code.clone(), c))
            .collect::<HashMap<_, _>>();
        let categories = Category::find()
            .all(db)
            .await?
            .into_iter()
            .map(|c| (c.id, c))
            .collect::<HashMap<_, _>>();

        let Some(transaction_items) =
            items
                .into_iter()
                .map(|item| {
                    Some(TransactionItemWithAccount {
                        id: item.id,
                        notes: item.notes,
                        transaction_id: item.transaction_id,
                        amount: item.amount,
                        account: accounts.get(&item.account_id).cloned().and_then(|a| {
                            let c = a.currency_code.clone();
                            Some(AccountModel::from_model(a).with_currency(
                                CurrencyModel::from_model(currencies.get(&c).cloned()?),
                            ))
                        })?,
                        category: item.category_id.and_then(|cid| {
                            categories
                                .get(&cid)
                                .cloned()
                                .map(|c| CategoryModel::new(c.id, c.name, c.group, c.icon))
                        }),
                    })
                })
                .collect::<Option<_>>()
        else {
            return Ok(None);
        };

        Ok(Some(TransactionWithAccount {
            id: transaction.id,
            title: transaction.title,
            timestamp: transaction.timestamp,
            transaction_items,
        }))
    }

    pub async fn upsert(self, db: &DbConn) -> Result<Uuid, DbErr> {
        let transaction = db
            .transaction::<_, _, DbErr>(|txn| {
                Box::pin(async move {
                    let transaction_model = Transaction::insert(ActiveModel {
                        id: ActiveValue::Set(self.id),
                        title: ActiveValue::Set(self.title.trim().to_owned()),
                        timestamp: ActiveValue::Set(self.timestamp),
                    })
                    .on_conflict(
                        OnConflict::column(Column::Id)
                            .update_columns([Column::Title, Column::Timestamp])
                            .to_owned(),
                    )
                    .exec(txn)
                    .await?;

                    TransactionItem::delete(transaction_item::ActiveModel::default())
                        .filter(
                            transaction_item::Column::TransactionId
                                .eq(transaction_model.last_insert_id),
                        )
                        .exec(txn)
                        .await?;

                    for item in &self.transaction_items {
                        TransactionItem::insert(transaction_item::ActiveModel {
                            id: ActiveValue::Set(item.id),
                            notes: ActiveValue::Set(item.notes.trim().to_owned()),
                            transaction_id: ActiveValue::Set(item.transaction_id),
                            account_id: ActiveValue::Set(item.account_id),
                            category_id: ActiveValue::Set(item.category_id),
                            amount: ActiveValue::Set(item.amount),
                        })
                        .on_conflict(
                            OnConflict::column(transaction_item::Column::Id)
                                .update_columns([
                                    transaction_item::Column::Notes,
                                    transaction_item::Column::TransactionId,
                                    transaction_item::Column::AccountId,
                                    transaction_item::Column::CategoryId,
                                    transaction_item::Column::Amount,
                                ])
                                .to_owned(),
                        )
                        .exec(txn)
                        .await?;
                    }

                    Ok(transaction_model.last_insert_id)
                })
            })
            .await
            .map_err(|e| match e {
                sea_orm::TransactionError::Connection(e)
                | sea_orm::TransactionError::Transaction(e) => e,
            })?;

        Ok(transaction)
    }

    pub async fn upsert_many(transactions: Vec<Self>, db: &DbConn) -> Result<(), DbErr> {
        db.transaction::<_, _, DbErr>(|txn| {
            Box::pin(async move {
                for tx in transactions {
                    let transaction_model = Transaction::insert(ActiveModel {
                        id: ActiveValue::Set(tx.id),
                        title: ActiveValue::Set(tx.title.trim().to_owned()),
                        timestamp: ActiveValue::Set(tx.timestamp),
                    })
                    .on_conflict(
                        OnConflict::column(Column::Id)
                            .update_columns([Column::Title, Column::Timestamp])
                            .to_owned(),
                    )
                    .exec(txn)
                    .await?;

                    TransactionItem::delete(transaction_item::ActiveModel::default())
                        .filter(
                            transaction_item::Column::TransactionId
                                .eq(transaction_model.last_insert_id),
                        )
                        .exec(txn)
                        .await?;

                    for item in &tx.transaction_items {
                        TransactionItem::insert(transaction_item::ActiveModel {
                            id: ActiveValue::Set(item.id),
                            notes: ActiveValue::Set(item.notes.trim().to_owned()),
                            transaction_id: ActiveValue::Set(item.transaction_id),
                            account_id: ActiveValue::Set(item.account_id),
                            category_id: ActiveValue::Set(item.category_id),
                            amount: ActiveValue::Set(item.amount),
                        })
                        .on_conflict(
                            OnConflict::column(transaction_item::Column::Id)
                                .update_columns([
                                    transaction_item::Column::Notes,
                                    transaction_item::Column::TransactionId,
                                    transaction_item::Column::AccountId,
                                    transaction_item::Column::CategoryId,
                                    transaction_item::Column::Amount,
                                ])
                                .to_owned(),
                        )
                        .exec(txn)
                        .await?;
                    }
                }

                Ok(())
            })
        })
        .await
        .map_err(|e| match e {
            sea_orm::TransactionError::Connection(e)
            | sea_orm::TransactionError::Transaction(e) => e,
        })?;

        Ok(())
    }

    pub async fn delete(db: &DbConn, id: Uuid) -> Result<(), DbErr> {
        Transaction::delete_by_id(id).exec(db).await?;
        Ok(())
    }
}

impl TransactionItemModel {
    pub const fn new(
        id: Uuid,
        notes: String,
        transaction_id: Uuid,
        account_id: Uuid,
        category_id: Option<Uuid>,
        amount: i64,
    ) -> Self {
        Self {
            id,
            notes,
            transaction_id,
            account_id,
            category_id,
            amount,
        }
    }

    pub fn with_account(
        self,
        category: Option<CategoryModel>,
        account: AccountWithCurrency,
    ) -> TransactionItemWithAccount {
        TransactionItemWithAccount {
            category,
            account,
            id: self.id,
            notes: self.notes,
            transaction_id: self.transaction_id,
            amount: self.amount,
        }
    }

    pub async fn delete(db: &DbConn, id: Uuid) -> Result<(), DbErr> {
        TransactionItem::delete_by_id(id).exec(db).await?;
        Ok(())
    }
}

#[derive(ToSchema, Serialize, Deserialize)]
pub struct TransactionWithAccount {
    id: Uuid,
    title: String,
    timestamp: chrono::DateTime<chrono::Utc>,
    transaction_items: Vec<TransactionItemWithAccount>,
}

#[derive(ToSchema, Serialize, Deserialize)]
pub struct TransactionItemWithAccount {
    id: Uuid,
    notes: String,
    transaction_id: Uuid,
    account: AccountWithCurrency,
    category: Option<CategoryModel>,
    amount: i64,
}

impl TransactionWithAccount {
    pub const fn new(id: Uuid, title: String, timestamp: chrono::DateTime<chrono::Utc>) -> Self {
        Self {
            id,
            title,
            timestamp,
            transaction_items: vec![],
        }
    }

    pub fn with_items(self, transaction_items: Vec<TransactionItemWithAccount>) -> Self {
        Self {
            transaction_items,
            ..self
        }
    }
}
