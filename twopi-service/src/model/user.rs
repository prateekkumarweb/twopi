use chrono::{DateTime, Utc};
use sea_orm::{ActiveValue, ColumnTrait, DbConn, DbErr, EntityTrait, QueryFilter};
use uuid::Uuid;

use crate::user_entity::{
    self,
    prelude::User as UserEnitty,
    user::{ActiveModel, Model},
};

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

    pub async fn create_user(
        db: &DbConn,
        name: &str,
        email: &str,
        password_hash: &str,
    ) -> Result<Self, DbErr> {
        let model = Self {
            id: Uuid::now_v7(),
            name: name.to_string(),
            email: email.to_string(),
            password_hash: password_hash.to_string(),
            email_verified: false,
            created_at: Utc::now(),
        };
        UserEnitty::insert(ActiveModel {
            id: ActiveValue::Set(model.id),
            name: ActiveValue::Set(model.name.clone()),
            email: ActiveValue::Set(model.email.clone()),
            password_hash: ActiveValue::Set(model.password_hash.clone()),
            email_verified: ActiveValue::Set(model.email_verified),
            created_at: ActiveValue::Set(model.created_at),
        })
        .exec(db)
        .await?;
        Ok(model)
    }
}
