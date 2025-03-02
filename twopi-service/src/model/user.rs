use chrono::{DateTime, Utc};
use sea_orm::{ActiveValue, ColumnTrait, DbConn, DbErr, EntityTrait, QueryFilter};
use secrecy::{ExposeSecret, SecretString};
use serde::Serialize;
use utoipa::ToSchema;
use uuid::Uuid;

use crate::user_entity::{
    self,
    prelude::User as UserEnitty,
    user::{ActiveModel, Model},
};

#[derive(Debug, Clone, ToSchema, Serialize)]
pub struct User {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: SecretString,
    pub email_verified: bool,
    pub created_at: DateTime<Utc>,
}

impl User {
    pub fn from_model(model: Model) -> Self {
        Self {
            id: model.id,
            name: model.name,
            email: model.email,
            password_hash: model.password_hash.into(),
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
            password_hash: password_hash.into(),
            email_verified: false,
            created_at: Utc::now(),
        };
        UserEnitty::insert(ActiveModel {
            id: ActiveValue::Set(model.id),
            name: ActiveValue::Set(model.name.clone()),
            email: ActiveValue::Set(model.email.clone()),
            password_hash: ActiveValue::Set(model.password_hash.expose_secret().to_owned()),
            email_verified: ActiveValue::Set(model.email_verified),
            created_at: ActiveValue::Set(model.created_at),
            settings: ActiveValue::NotSet,
        })
        .exec(db)
        .await?;
        Ok(model)
    }

    pub async fn update_email_verified(
        db: &DbConn,
        id: Uuid,
        email_verified: bool,
    ) -> Result<(), DbErr> {
        UserEnitty::update(ActiveModel {
            id: ActiveValue::Set(id),
            name: ActiveValue::NotSet,
            email: ActiveValue::NotSet,
            password_hash: ActiveValue::NotSet,
            email_verified: ActiveValue::Set(email_verified),
            created_at: ActiveValue::NotSet,
            settings: ActiveValue::NotSet,
        })
        .exec(db)
        .await?;
        Ok(())
    }
}
