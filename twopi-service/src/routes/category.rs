use axum::{extract::Query, Json};
use serde::Deserialize;
use utoipa::IntoParams;
use utoipa_axum::{router::OpenApiRouter, routes};
use uuid::Uuid;

use crate::{
    database,
    model::category::{CategoryModel, NewCategoryModel},
    AppError, AppResult, XUserId,
};

pub fn router() -> OpenApiRouter<()> {
    OpenApiRouter::new().routes(routes![category, post_category, delete_category])
}

#[tracing::instrument]
#[utoipa::path(get, path = "/", responses(
    (status = OK, body = Vec<CategoryModel>),
    AppError
))]
async fn category(id: XUserId) -> AppResult<Json<Vec<CategoryModel>>> {
    let db = database(&id.0).await?;
    Ok(Json(CategoryModel::find_all(&db).await?))
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
async fn delete_category(
    id: XUserId,
    Query(DeleteCategoryParams { id: category_id }): Query<DeleteCategoryParams>,
) -> AppResult<()> {
    let db = database(&id.0).await?;
    CategoryModel::delete(&db, category_id).await?;
    Ok(())
}

#[tracing::instrument(skip(category))]
#[utoipa::path(post, path = "/",
    request_body = NewCategoryModel, responses(
    (status = OK, body = ()),
    AppError
))]
async fn post_category(id: XUserId, Json(category): Json<NewCategoryModel>) -> AppResult<()> {
    let db = database(&id.0).await?;
    CategoryModel::upsert(category, &db).await?;
    Ok(())
}
