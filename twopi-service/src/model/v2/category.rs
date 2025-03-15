use migration::OnConflict;
use sea_orm::{ActiveValue, ColumnTrait, DbConn, DbErr, EntityTrait, QueryFilter, QueryOrder};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;
use validator::Validate;

use crate::entity::category;

#[derive(Debug, Clone, ToSchema, Serialize, Deserialize)]
pub struct CategoryModel(#[schema(inline)] pub category::Model);
pub type CategoryEntity = category::Entity;
pub type CategoryActiveModel = category::ActiveModel;
pub type CategoryColumn = category::Column;

#[derive(Debug, Clone, ToSchema, Serialize, Deserialize, Validate)]
pub struct CategoryReq {
    pub id: Option<Uuid>,
    #[validate(length(min = 1, max = 100))]
    pub name: String,
    #[validate(length(min = 0, max = 100))]
    pub group: String,
    #[validate(length(min = 0, max = 100))]
    pub icon: String,
}

impl CategoryReq {
    pub async fn find_all(db: &DbConn) -> Result<Vec<CategoryModel>, DbErr> {
        CategoryEntity::find()
            .order_by_asc(CategoryColumn::Name)
            .all(db)
            .await
            .map(|v| v.into_iter().map(CategoryModel).collect())
    }

    pub async fn _find_one(db: &DbConn, id: Uuid) -> Result<Option<CategoryModel>, DbErr> {
        CategoryEntity::find()
            .filter(CategoryColumn::Id.eq(id))
            .one(db)
            .await
            .map(|c| c.map(CategoryModel))
    }

    pub async fn upsert(db: &DbConn, category: Self) -> Result<Uuid, DbErr> {
        CategoryEntity::insert(CategoryActiveModel {
            id: ActiveValue::Set(category.id.unwrap_or_else(Uuid::now_v7)),
            name: ActiveValue::Set(category.name),
            group: ActiveValue::Set(category.group),
            icon: ActiveValue::Set(category.icon),
        })
        .on_conflict(
            OnConflict::column(CategoryColumn::Id)
                .update_columns([
                    CategoryColumn::Name,
                    CategoryColumn::Group,
                    CategoryColumn::Icon,
                ])
                .to_owned(),
        )
        .exec(db)
        .await
        .map(|c| c.last_insert_id)
    }

    pub async fn delete(db: &DbConn, id: Uuid) -> Result<(), DbErr> {
        CategoryEntity::delete_by_id(id).exec(db).await?;
        Ok(())
    }
}
