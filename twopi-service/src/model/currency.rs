use migration::OnConflict;
use sea_orm::{ActiveValue, DbConn, DbErr, EntityTrait};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use validator::Validate;

use crate::entity::{
    currency::{ActiveModel, Column, Model},
    prelude::*,
};

#[derive(Clone, ToSchema, Serialize, Deserialize, Validate)]
pub struct CurrencyModel {
    #[validate(length(min = 3, max = 3))]
    code: String,
    #[validate(length(min = 1, max = 100))]
    name: String,
    #[validate(range(min = 0, max = 10))]
    decimal_digits: i32,
}

impl CurrencyModel {
    pub const fn new(code: String, name: String, decimal_digits: i32) -> Self {
        Self {
            code,
            name,
            decimal_digits,
        }
    }

    pub fn from_model(model: Model) -> Self {
        Self {
            code: model.code,
            name: model.name,
            decimal_digits: model.decimal_digits,
        }
    }

    pub async fn find_all(db: &DbConn) -> Result<Vec<Self>, DbErr> {
        Currency::find().all(db).await.map(|currencies| {
            currencies
                .into_iter()
                .map(|c| Self {
                    code: c.code.to_string(),
                    name: c.name,
                    decimal_digits: c.decimal_digits,
                })
                .collect()
        })
    }

    pub async fn find_by_code(db: &DbConn, code: &str) -> Result<Option<Self>, DbErr> {
        Currency::find_by_id(code).one(db).await.map(|currency| {
            currency.map(|c| Self {
                code: c.code.to_string(),
                name: c.name,
                decimal_digits: c.decimal_digits,
            })
        })
    }

    pub async fn insert(self, db: &DbConn) -> Result<String, DbErr> {
        let result = Currency::insert(ActiveModel {
            code: ActiveValue::Set(self.code),
            name: ActiveValue::Set(self.name),
            decimal_digits: ActiveValue::Set(self.decimal_digits),
        })
        .exec(db)
        .await?;
        Ok(result.last_insert_id)
    }

    pub async fn delete(db: &DbConn, code: String) -> Result<(), DbErr> {
        Currency::delete_by_id(code).exec(db).await?;
        Ok(())
    }

    pub async fn upsert_many(list: Vec<Self>, db: &DbConn) -> Result<(), DbErr> {
        Currency::insert_many(list.into_iter().map(|item| ActiveModel {
            code: ActiveValue::Set(item.code),
            name: ActiveValue::Set(item.name),
            decimal_digits: ActiveValue::Set(item.decimal_digits),
        }))
        .on_conflict(
            OnConflict::column(Column::Code)
                .update_columns([Column::Name, Column::DecimalDigits])
                .to_owned(),
        )
        .exec(db)
        .await?;
        Ok(())
    }
}
