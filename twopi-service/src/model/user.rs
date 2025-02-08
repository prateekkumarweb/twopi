use chrono::{DateTime, Utc};
use sea_orm::{ColumnTrait, DbConn, DbErr, EntityTrait, QueryFilter};
use uuid::Uuid;

use crate::user_entity::{self, prelude::User as UserEnitty, user::Model};

#[derive(Debug, Clone)]
pub struct User {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub password_hash: String,
    pub email_verified: bool,
    pub created_at: DateTime<Utc>,
}

impl User {
    pub fn from_model(model: Model) -> Self {
        Self {
            id: model.id,
            name: model.name,
            email: model.email,
            password_hash: model.password_hash,
            email_verified: model.email_verified,
            created_at: model.created_at,
        }
    }

    pub async fn find_by_id(db: &DbConn, id: Uuid) -> Result<Option<Self>, DbErr> {
        UserEnitty::find_by_id(id)
            .one(db)
            .await
            .map(|r| r.map(Self::from_model))
    }

    pub async fn find_by_email(db: &DbConn, email: &str) -> Result<Option<Self>, DbErr> {
        UserEnitty::find()
            .filter(user_entity::user::Column::Email.eq(email))
            .one(db)
            .await
            .map(|r| r.map(Self::from_model))
    }
}
