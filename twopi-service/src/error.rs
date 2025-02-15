use axum::{
    extract::rejection::JsonRejection,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use sea_orm::DbErr;
use utoipa::{openapi::ResponsesBuilder, ToResponse, ToSchema};
use validator::ValidationErrors;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error(transparent)]
    DbErr(#[from] DbErr),
    #[error(transparent)]
    ValidationError(#[from] ValidationErrors),
    #[error(transparent)]
    AxumJsonRejection(#[from] JsonRejection),
    #[error(transparent)]
    Unauthorized(anyhow::Error),
    #[error(transparent)]
    Other(anyhow::Error),
}

pub type AppResult<T> = Result<T, AppError>;

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        tracing::error!("Error: {:?}", self);
        match self {
            Self::ValidationError(_) => {
                let message = format!("Input validation error: [{self}]").replace('\n', ", ");
                (StatusCode::BAD_REQUEST, message)
            }
            Self::AxumJsonRejection(_) => (StatusCode::BAD_REQUEST, self.to_string()),
            Self::Unauthorized(_) => (StatusCode::UNAUTHORIZED, self.to_string()),
            Self::DbErr(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
            Self::Other(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
        }
        .into_response()
    }
}

#[derive(ToSchema, ToResponse)]
#[allow(dead_code)]
struct AppErrorSchema(String);

impl utoipa::IntoResponses for AppError {
    fn responses() -> std::collections::BTreeMap<
        String,
        utoipa::openapi::RefOr<utoipa::openapi::response::Response>,
    > {
        let mut builder = ResponsesBuilder::new();
        let mut string_schemas = vec![];
        <String as ToSchema>::schemas(&mut string_schemas);
        builder = builder.response("400", <AppErrorSchema as ToResponse>::response().1);
        builder = builder.response("401", <AppErrorSchema as ToResponse>::response().1);
        builder = builder.response("500", <AppErrorSchema as ToResponse>::response().1);
        builder.build().into()
    }
}
