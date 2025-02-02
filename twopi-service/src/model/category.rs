use sea_orm::prelude::Uuid;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(ToSchema, Serialize, Deserialize)]
pub struct CategoryModel {
    pub id: Uuid,
    pub name: String,
    pub group: String,
    pub icon: String,
}
