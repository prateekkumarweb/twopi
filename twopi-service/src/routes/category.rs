use axum::{Json, extract::Query};
use serde::Deserialize;
use utoipa::IntoParams;
use utoipa_axum::{router::OpenApiRouter, routes};
use uuid::Uuid;

use crate::{
    AppError, AppResult, ValidatedJson, XUserId, database,
    model::v2::category::{CategoryModel, CategoryReq},
};

pub fn router() -> OpenApiRouter<()> {
    OpenApiRouter::new().routes(routes![category, post_category, delete_category])
}

#[tracing::instrument]
#[utoipa::path(get, path = "/", responses(
    (status = OK, body = Vec<CategoryModel>),
    AppError
))]
#[axum::debug_handler]
async fn category(id: XUserId) -> AppResult<Json<Vec<CategoryModel>>> {
    let db = database(&id.0).await?;
    Ok(Json(CategoryReq::find_all(&db).await?))
}

#[derive(Deserialize, IntoParams)]
struct DeleteCategoryParams {
    #[into_params(names("id"), parameter_in = Query)]
    id: Uuid,
}

#[tracing::instrument]
#[utoipa::path(delete, path = "/", params(DeleteCategoryParams), responses(
    (status = OK, body = ()),
    AppError
))]
#[axum::debug_handler]
async fn delete_category(
    id: XUserId,
    Query(DeleteCategoryParams { id: category_id }): Query<DeleteCategoryParams>,
) -> AppResult<()> {
    let db = database(&id.0).await?;
    CategoryReq::delete(&db, category_id).await?;
    Ok(())
}

#[tracing::instrument(skip(category))]
#[utoipa::path(post, path = "/",
    request_body = CategoryReq, responses(
    (status = OK, body = ()),
    AppError
))]
#[axum::debug_handler]
async fn post_category(
    id: XUserId,
    ValidatedJson(category): ValidatedJson<CategoryReq>,
) -> AppResult<()> {
    let db = database(&id.0).await?;
    CategoryReq::upsert(&db, category).await?;
    Ok(())
}
