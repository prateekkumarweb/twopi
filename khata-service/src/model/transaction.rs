use migration::OnConflict;
use sea_orm::{
    ActiveValue, ColumnTrait, DbConn, DbErr, EntityTrait, QueryFilter, QueryOrder, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;
use validator::Validate;

use super::{
    account::{AccountColumn, AccountEntity},
    category::{CategoryActiveModel, CategoryColumn, CategoryEntity},
};
use crate::entity::{transaction, transaction_item};

#[derive(Debug, Clone, ToSchema, Serialize, Deserialize)]
pub struct TransactionModel(#[schema(inline)] pub transaction::Model);
pub type TransactionEntity = transaction::Entity;
pub type TransactionActiveModel = transaction::ActiveModel;
pub type TransactionColumn = transaction::Column;

#[derive(Debug, Clone, ToSchema, Serialize, Deserialize)]
pub struct TransactionItemModel(#[schema(inline)] pub transaction_item::Model);
pub type TransactionItemEntity = transaction_item::Entity;
pub type TransactionItemActiveModel = transaction_item::ActiveModel;
pub type TransactionItemColumn = transaction_item::Column;

#[derive(Debug, Clone, ToSchema, Serialize, Deserialize, Validate)]
pub struct TransactionReq {
    pub id: Option<Uuid>,
    #[validate(length(min = 1, max = 100))]
    pub title: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub items: Vec<TransactionItemReq>,
}

#[derive(Debug, Clone, ToSchema, Serialize, Deserialize, Validate)]
pub struct TransactionItemReq {
    id: Option<Uuid>,
    #[validate(length(min = 0, max = 100))]
    notes: String,
    #[validate(length(min = 1, max = 100))]
    account_name: String,
    #[validate(length(min = 1, max = 100))]
    category_name: Option<String>,
    amount: i64,
}

#[derive(Debug, Clone, ToSchema, Serialize, Deserialize)]
pub struct TransactionExpandedModel {
    pub transaction: TransactionModel,
    pub items: Vec<TransactionItemModel>,
}

impl TransactionReq {
    pub async fn find_all_with_items(db: &DbConn) -> Result<Vec<TransactionExpandedModel>, DbErr> {
        TransactionEntity::find()
            .order_by_asc(TransactionColumn::Timestamp)
            .find_with_related(TransactionItemEntity::default())
            .all(db)
            .await
            .map(|transactions| {
                transactions
                    .into_iter()
                    .map(|(t, items)| {
                        Some(TransactionExpandedModel {
                            transaction: TransactionModel(t),
                            items: items.into_iter().map(TransactionItemModel).collect(),
                        })
                    })
                    .collect::<Option<_>>()
                    .unwrap_or_default()
            })
    }

    pub async fn find_one_with_items(
        db: &DbConn,
        id: Uuid,
    ) -> Result<Option<TransactionExpandedModel>, DbErr> {
        TransactionEntity::find_by_id(id)
            .find_with_related(TransactionItemEntity::default())
            .all(db)
            .await
            .map(|t| {
                let t = t.into_iter().next();
                t.map(|(t, items)| TransactionExpandedModel {
                    transaction: TransactionModel(t),
                    items: items.into_iter().map(TransactionItemModel).collect(),
                })
            })
    }

    pub async fn find_by_month(
        db: &DbConn,
        start_timestamp: chrono::DateTime<chrono::Utc>,
        // End time is exclusive
        end_timestamp: chrono::DateTime<chrono::Utc>,
    ) -> Result<Vec<TransactionExpandedModel>, DbErr> {
        let transactions = TransactionEntity::find()
            .filter(
                transaction::Column::Timestamp
                    .gte(start_timestamp)
                    .and(transaction::Column::Timestamp.lt(end_timestamp)),
            )
            .order_by_desc(transaction::Column::Timestamp)
            .find_with_related(TransactionItemEntity::default())
            .all(db)
            .await?;

        Ok(transactions
            .into_iter()
            .map(|(t, items)| {
                Some(TransactionExpandedModel {
                    transaction: TransactionModel(t),
                    items: items.into_iter().map(TransactionItemModel).collect(),
                })
            })
            .collect::<Option<_>>()
            .unwrap_or_default())
    }

    pub async fn upsert(db: &DbConn, tx: Self) -> Result<Uuid, DbErr> {
        let id = db
            .transaction::<_, _, DbErr>(|txn| {
                Box::pin(async move {
                    let tx_id = tx.id.unwrap_or_else(|| {
                        Uuid::new_v7(uuid::Timestamp::from_unix(
                            uuid::timestamp::context::NoContext,
                            tx.timestamp.timestamp() as u64,
                            0,
                        ))
                    });
                    TransactionEntity::insert(TransactionActiveModel {
                        id: ActiveValue::Set(tx_id),
                        title: ActiveValue::Set(tx.title.trim().to_owned()),
                        timestamp: ActiveValue::Set(tx.timestamp),
                    })
                    .on_conflict(
                        OnConflict::column(TransactionColumn::Id)
                            .update_columns([
                                TransactionColumn::Title,
                                TransactionColumn::Timestamp,
                            ])
                            .to_owned(),
                    )
                    .exec(txn)
                    .await?;

                    let old_items = TransactionItemEntity::find()
                        .filter(transaction_item::Column::TransactionId.eq(tx_id))
                        .all(txn)
                        .await?;

                    for item in old_items {
                        TransactionItemEntity::delete_by_id(item.id)
                            .exec(txn)
                            .await?;
                    }

                    for item in &tx.items {
                        let account = AccountEntity::find()
                            .filter(AccountColumn::Name.eq(item.account_name.to_string()))
                            .one(txn)
                            .await?
                            .ok_or_else(|| {
                                DbErr::RecordNotFound(format!(
                                    "account_name: {:?}",
                                    item.account_name
                                ))
                            })?;
                        let cat_id = if let Some(cat) = &item.category_name {
                            let found = CategoryEntity::find()
                                .filter(CategoryColumn::Name.eq(item.category_name.clone()))
                                .one(txn)
                                .await?;
                            if let Some(found) = found {
                                Some(found.id)
                            } else {
                                Some(
                                    CategoryEntity::insert(CategoryActiveModel {
                                        id: ActiveValue::Set(Uuid::new_v7(
                                            uuid::Timestamp::from_unix(
                                                uuid::timestamp::context::NoContext,
                                                tx.timestamp.timestamp() as u64,
                                                0,
                                            ),
                                        )),
                                        name: ActiveValue::Set(cat.clone()),
                                        group: ActiveValue::Set(String::new()),
                                        icon: ActiveValue::Set(String::new()),
                                    })
                                    .on_conflict(
                                        OnConflict::column(CategoryColumn::Name)
                                            .do_nothing()
                                            .to_owned(),
                                    )
                                    .exec(txn)
                                    .await?
                                    .last_insert_id,
                                )
                            }
                        } else {
                            None
                        };

                        TransactionItemEntity::insert(TransactionItemActiveModel {
                            id: ActiveValue::Set(item.id.unwrap_or_else(|| {
                                Uuid::new_v7(uuid::Timestamp::from_unix(
                                    uuid::timestamp::context::NoContext,
                                    tx.timestamp.timestamp() as u64,
                                    0,
                                ))
                            })),
                            notes: ActiveValue::Set(item.notes.trim().to_owned()),
                            transaction_id: ActiveValue::Set(tx_id),
                            account_id: ActiveValue::Set(account.id),
                            category_id: ActiveValue::Set(cat_id),
                            amount: ActiveValue::Set(item.amount),
                        })
                        .on_conflict(
                            OnConflict::column(TransactionItemColumn::Id)
                                .update_columns([
                                    TransactionItemColumn::Notes,
                                    TransactionItemColumn::TransactionId,
                                    TransactionItemColumn::AccountId,
                                    TransactionItemColumn::CategoryId,
                                    TransactionItemColumn::Amount,
                                ])
                                .to_owned(),
                        )
                        .exec(txn)
                        .await?;
                    }

                    Ok(tx_id)
                })
            })
            .await
            .map_err(|e| match e {
                sea_orm::TransactionError::Connection(e)
                | sea_orm::TransactionError::Transaction(e) => e,
            })?;

        Ok(id)
    }

    pub async fn upsert_many(db: &DbConn, transactions: Vec<Self>) -> Result<(), DbErr> {
        db.transaction::<_, _, DbErr>(|txn| {
            Box::pin(async move {
                for tx in transactions {
                    let tx_id = tx.id.unwrap_or_else(|| {
                        Uuid::new_v7(uuid::Timestamp::from_unix(
                            uuid::timestamp::context::NoContext,
                            tx.timestamp.timestamp() as u64,
                            0,
                        ))
                    });
                    TransactionEntity::insert(TransactionActiveModel {
                        id: ActiveValue::Set(tx_id),
                        title: ActiveValue::Set(tx.title.trim().to_owned()),
                        timestamp: ActiveValue::Set(tx.timestamp),
                    })
                    .on_conflict(
                        OnConflict::column(TransactionColumn::Id)
                            .update_columns([
                                TransactionColumn::Title,
                                TransactionColumn::Timestamp,
                            ])
                            .to_owned(),
                    )
                    .exec(txn)
                    .await?;

                    let old_items = TransactionItemEntity::find()
                        .filter(transaction_item::Column::TransactionId.eq(tx_id))
                        .all(txn)
                        .await?;

                    for item in old_items {
                        TransactionItemEntity::delete_by_id(item.id)
                            .exec(txn)
                            .await?;
                    }

                    for item in &tx.items {
                        let account = AccountEntity::find()
                            .filter(AccountColumn::Name.eq(item.account_name.to_string()))
                            .one(txn)
                            .await?
                            .ok_or_else(|| {
                                DbErr::RecordNotFound(format!(
                                    "account_name: {:?}",
                                    item.account_name
                                ))
                            })?;
                        let cat_id = if let Some(cat) = &item.category_name {
                            let found = CategoryEntity::find()
                                .filter(CategoryColumn::Name.eq(item.category_name.clone()))
                                .one(txn)
                                .await?;
                            if let Some(found) = found {
                                Some(found.id)
                            } else if cat.is_empty() {
                                None
                            } else {
                                Some(
                                    CategoryEntity::insert(CategoryActiveModel {
                                        id: ActiveValue::Set(Uuid::new_v7(
                                            uuid::Timestamp::from_unix(
                                                uuid::timestamp::context::NoContext,
                                                tx.timestamp.timestamp() as u64,
                                                0,
                                            ),
                                        )),
                                        name: ActiveValue::Set(cat.clone()),
                                        group: ActiveValue::Set(String::new()),
                                        icon: ActiveValue::Set(String::new()),
                                    })
                                    .on_conflict(
                                        OnConflict::column(CategoryColumn::Name)
                                            .do_nothing()
                                            .to_owned(),
                                    )
                                    .exec(txn)
                                    .await?
                                    .last_insert_id,
                                )
                            }
                        } else {
                            None
                        };

                        TransactionItemEntity::insert(TransactionItemActiveModel {
                            id: ActiveValue::Set(item.id.unwrap_or_else(|| {
                                Uuid::new_v7(uuid::Timestamp::from_unix(
                                    uuid::timestamp::context::NoContext,
                                    tx.timestamp.timestamp() as u64,
                                    0,
                                ))
                            })),
                            notes: ActiveValue::Set(item.notes.trim().to_owned()),
                            transaction_id: ActiveValue::Set(tx_id),
                            account_id: ActiveValue::Set(account.id),
                            category_id: ActiveValue::Set(cat_id),
                            amount: ActiveValue::Set(item.amount),
                        })
                        .on_conflict(
                            OnConflict::column(TransactionItemColumn::Id)
                                .update_columns([
                                    TransactionItemColumn::Notes,
                                    TransactionItemColumn::TransactionId,
                                    TransactionItemColumn::AccountId,
                                    TransactionItemColumn::CategoryId,
                                    TransactionItemColumn::Amount,
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
        TransactionEntity::delete_by_id(id).exec(db).await?;
        Ok(())
    }

    pub async fn delete_item(db: &DbConn, id: Uuid) -> Result<(), DbErr> {
        TransactionItemEntity::delete_by_id(id).exec(db).await?;
        Ok(())
    }
}
