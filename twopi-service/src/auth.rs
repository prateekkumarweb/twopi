use argon2::{Argon2, PasswordHash, PasswordVerifier};
use async_trait::async_trait;
use axum_login::{AuthUser, AuthnBackend, UserId};
use sea_orm::{DbConn, DbErr};
use serde::Deserialize;
use uuid::Uuid;

use crate::model::user::User;

impl AuthUser for User {
    type Id = Uuid;

    fn id(&self) -> Self::Id {
        self.id
    }

    fn session_auth_hash(&self) -> &[u8] {
        self.password_hash.as_bytes()
    }
}

#[derive(Clone)]
pub struct Backend {
    db: DbConn,
}

impl Backend {
    pub const fn new(db: DbConn) -> Self {
        Self { db }
    }
}

#[derive(Clone, Deserialize)]
pub struct Credentials {
    email: String,
    password: String,
}

#[async_trait]
impl AuthnBackend for Backend {
    type User = User;
    type Credentials = Credentials;
    type Error = DbErr;

    async fn authenticate(
        &self,
        Credentials { email, password }: Self::Credentials,
    ) -> Result<Option<Self::User>, Self::Error> {
        let user = User::find_by_email(&self.db, &email).await?;
        if let Some(user) = user {
            #[allow(clippy::unwrap_used)]
            let parsed_hash = PasswordHash::new(&user.password_hash).unwrap();
            let verified = Argon2::default().verify_password(password.as_bytes(), &parsed_hash);
            if verified.is_ok() {
                Ok(Some(user))
            } else {
                Ok(None)
            }
        } else {
            Ok(None)
        }
    }

    async fn get_user(&self, user_id: &UserId<Self>) -> Result<Option<Self::User>, Self::Error> {
        User::find_by_id(&self.db, *user_id).await
    }
}
