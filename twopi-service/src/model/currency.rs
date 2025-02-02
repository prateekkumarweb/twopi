use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(ToSchema, Serialize, Deserialize)]
pub struct CurrencyModel {
    pub code: String,
    pub name: String,
    pub decimal_digits: i32,
}
