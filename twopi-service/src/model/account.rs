use migration::AccountType;
use sea_orm::prelude::Uuid;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use super::currency::CurrencyModel;

#[derive(ToSchema, Serialize, Deserialize)]
pub struct AccountModel {
    pub id: Uuid,
    pub name: String,
    pub account_type: AccountType,
    pub currency_code: String,
    pub starting_balance: i64,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub account_extra: Option<serde_json::Value>,
}

#[derive(ToSchema, Serialize, Deserialize)]
pub struct AccountWithCurrency {
    pub id: Uuid,
    pub name: String,
    pub account_type: AccountType,
    pub currency: CurrencyModel,
    pub starting_balance: i64,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub account_extra: Option<serde_json::Value>,
}
