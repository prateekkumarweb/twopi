use chrono::Utc;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::KEYS;

pub struct Keys {
    encoding: EncodingKey,
    decoding: DecodingKey,
}

impl Keys {
    pub fn new(secret: &[u8]) -> Self {
        Self {
            encoding: EncodingKey::from_secret(secret),
            decoding: DecodingKey::from_secret(secret),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VerifyEmailClaim {
    id: Uuid,
    email: String,
    exp: usize,
}

pub async fn generate_verify_url(id: Uuid, email: &str) -> jsonwebtoken::errors::Result<String> {
    let claim = VerifyEmailClaim {
        id,
        email: email.to_string(),
        exp: Utc::now().timestamp() as usize + 600,
    };
    let token = encode(&Header::default(), &claim, &KEYS.encoding)?;
    Ok(format!(
        "http://localhost:8000/twopi-api/api/verify-email?token={}",
        token
    ))
}

pub async fn verify_email(token: String) -> jsonwebtoken::errors::Result<Uuid> {
    let claim = decode::<VerifyEmailClaim>(&token, &KEYS.decoding, &Validation::default())?;
    Ok(claim.claims.id)
}
