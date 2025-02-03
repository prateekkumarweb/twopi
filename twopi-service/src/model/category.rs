use sea_orm::{ActiveValue, DbConn, DbErr, EntityTrait};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::entity::{category::ActiveModel, prelude::*};

#[derive(Clone, ToSchema, Serialize, Deserialize)]
pub struct CategoryModel {
    id: Uuid,
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

    pub async fn insert(self, db: &DbConn) -> Result<Uuid, DbErr> {
        Category::insert(ActiveModel {
            id: ActiveValue::Set(self.id),
            name: ActiveValue::Set(self.name),
            group: ActiveValue::Set(self.group),
            icon: ActiveValue::Set(self.icon),
        })
        .exec(db)
        .await
        .map(|c| c.last_insert_id)
    }

    pub async fn delete(db: &DbConn, id: Uuid) -> Result<(), DbErr> {
        Category::delete_by_id(id).exec(db).await?;
        Ok(())
    }
}
