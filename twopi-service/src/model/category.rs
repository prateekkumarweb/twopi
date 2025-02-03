use migration::OnConflict;
use sea_orm::{ActiveValue, DbConn, DbErr, EntityTrait};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::entity::{
    category::{self, ActiveModel},
    prelude::*,
};

#[derive(Clone, ToSchema, Serialize, Deserialize)]
pub struct CategoryModel {
    id: Uuid,
    name: String,
    group: String,
    icon: String,
}

#[derive(Clone, ToSchema, Serialize, Deserialize)]
pub struct NewCategoryModel {
    id: Option<Uuid>,
    name: String,
    group: String,
    icon: String,
}

impl CategoryModel {
    pub const fn new(id: Uuid, name: String, group: String, icon: String) -> Self {
        Self {
            id,
            name,
            group,
            icon,
        }
    }

    pub const fn id(&self) -> Uuid {
        self.id
    }

    pub async fn find_all(db: &DbConn) -> Result<Vec<Self>, DbErr> {
        Category::find().all(db).await.map(|categories| {
            categories
                .into_iter()
                .map(|c| Self {
                    id: c.id,
                    name: c.name,
                    group: c.group,
                    icon: c.icon,
                })
                .collect()
        })
    }

    pub async fn upsert(cat: NewCategoryModel, db: &DbConn) -> Result<Uuid, DbErr> {
        Category::insert(ActiveModel {
            id: ActiveValue::Set(cat.id.unwrap_or_else(Uuid::now_v7)),
            name: ActiveValue::Set(cat.name),
            group: ActiveValue::Set(cat.group),
            icon: ActiveValue::Set(cat.icon),
        })
        .on_conflict(
            OnConflict::column(category::Column::Id)
                .update_columns([
                    category::Column::Name,
                    category::Column::Group,
                    category::Column::Icon,
                ])
                .to_owned(),
        )
        .exec(db)
        .await
        .map(|c| c.last_insert_id)
    }

    pub async fn delete(db: &DbConn, id: Uuid) -> Result<(), DbErr> {
        Category::delete_by_id(id).exec(db).await?;
        Ok(())
    }
}
