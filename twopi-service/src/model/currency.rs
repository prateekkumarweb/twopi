use migration::OnConflict;
use sea_orm::{ActiveValue, DbConn, DbErr, EntityTrait, QueryOrder};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use validator::Validate;

use crate::entity::currency;

#[derive(Debug, Clone, ToSchema, Serialize, Deserialize)]
pub struct CurrencyModel(#[schema(inline)] pub currency::Model);
pub type CurrencyEntity = currency::Entity;
pub type CurrencyActiveModel = currency::ActiveModel;
pub type CurrencyColumn = currency::Column;

#[derive(Debug, Clone, ToSchema, Serialize, Deserialize, Validate)]
pub struct CurrencyReq {
    #[validate(length(min = 3, max = 3))]
    pub code: String,
    #[validate(length(min = 1, max = 100))]
    pub name: String,
    #[validate(range(min = 0, max = 10))]
    pub decimal_digits: i32,
}

impl CurrencyReq {
    pub async fn find_all(db: &DbConn) -> Result<Vec<CurrencyModel>, DbErr> {
        CurrencyEntity::find()
            .order_by_asc(CurrencyColumn::Code)
            .all(db)
            .await
            .map(|v| v.into_iter().map(CurrencyModel).collect())
    }

    pub async fn find_one(db: &DbConn, code: &str) -> Result<Option<CurrencyModel>, DbErr> {
        CurrencyEntity::find_by_id(code)
            .one(db)
            .await
            .map(|c| c.map(CurrencyModel))
    }

    pub async fn upsert(db: &DbConn, currency: Self) -> Result<String, DbErr> {
        CurrencyEntity::insert(CurrencyActiveModel {
            code: ActiveValue::Set(currency.code),
            name: ActiveValue::Set(currency.name),
            decimal_digits: ActiveValue::Set(currency.decimal_digits),
        })
        .on_conflict(
            OnConflict::column(CurrencyColumn::Code)
                .update_columns([CurrencyColumn::Name, CurrencyColumn::DecimalDigits])
                .to_owned(),
        )
        .exec(db)
        .await
        .map(|c| c.last_insert_id)
    }

    pub async fn delete(db: &DbConn, code: &str) -> Result<(), DbErr> {
        CurrencyEntity::delete_by_id(code).exec(db).await?;
        Ok(())
    }

    pub async fn upsert_many(db: &DbConn, list: Vec<Self>) -> Result<(), DbErr> {
        CurrencyEntity::insert_many(list.into_iter().map(|item| CurrencyActiveModel {
            code: ActiveValue::Set(item.code),
            name: ActiveValue::Set(item.name),
            decimal_digits: ActiveValue::Set(item.decimal_digits),
        }))
        .on_conflict(
            OnConflict::column(CurrencyColumn::Code)
                .update_columns([CurrencyColumn::Name, CurrencyColumn::DecimalDigits])
                .to_owned(),
        )
        .exec(db)
        .await?;
        Ok(())
    }
}
