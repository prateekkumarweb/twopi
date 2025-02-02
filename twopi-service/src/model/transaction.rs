use sea_orm::prelude::Uuid;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(ToSchema, Serialize, Deserialize)]
pub struct TransactionModel {
    pub id: Uuid,
    pub title: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub transaction_items: Option<Vec<TransactionItemModel>>,
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
