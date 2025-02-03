use axum::{extract::Query, Json};
use axum_extra::TypedHeader;
use serde::Deserialize;
use utoipa::IntoParams;
use utoipa_axum::{router::OpenApiRouter, routes};
use uuid::Uuid;

use crate::{database, model::category::CategoryModel, AppResult, XUserId};

pub fn router() -> OpenApiRouter<()> {
    OpenApiRouter::new().routes(routes![category, post_category, delete_category])
}

#[axum::debug_handler]
#[utoipa::path(get, path = "/", params(XUserId), responses(
    (status = OK, body = Vec<CategoryModel>),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn category(TypedHeader(id): TypedHeader<XUserId>) -> AppResult<Json<Vec<CategoryModel>>> {
    let db = database(&id.0).await?;
    Ok(Json(CategoryModel::find_all(&db).await?))
}

#[derive(Deserialize, IntoParams)]
struct DeleteCategoryParams {
    #[into_params(names("id"), parameter_in = Query)]
    id: Uuid,
}

#[axum::debug_handler]
#[utoipa::path(delete, path = "/", params(XUserId, DeleteCategoryParams), responses(
    (status = OK, body = ()),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn delete_category(
    TypedHeader(id): TypedHeader<XUserId>,
    Query(DeleteCategoryParams { id: category_id }): Query<DeleteCategoryParams>,
) -> AppResult<()> {
    let db = database(&id.0).await?;
    CategoryModel::delete(&db, category_id).await?;
    Ok(())
}

#[axum::debug_handler]
#[utoipa::path(post, path = "/", params(XUserId),
    request_body = CategoryModel, responses(
    (status = OK, body = ()),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn post_category(
    TypedHeader(id): TypedHeader<XUserId>,
    Json(category): Json<CategoryModel>,
) -> AppResult<()> {
    let db = database(&id.0).await?;
    category.insert(&db).await?;
    Ok(())
}
