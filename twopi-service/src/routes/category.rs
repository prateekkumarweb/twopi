use axum::{extract::Query, response::IntoResponse, Json};
use axum_extra::TypedHeader;
use migration::OnConflict;
use sea_orm::{prelude::Uuid, ActiveValue, EntityTrait, QueryOrder};
use serde::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::{database, entity, AppError, AppResult, XUserId};

pub fn router() -> OpenApiRouter<()> {
    OpenApiRouter::new().routes(routes![category, put_category, delete_category])
}

#[derive(ToSchema, Serialize, Deserialize)]
struct Category {
    id: Uuid,
    name: String,
    group: String,
    icon: String,
}

#[axum::debug_handler]
#[utoipa::path(get, path = "/", params(XUserId), responses(
    (status = OK, body = Vec<Category>),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn category(TypedHeader(id): TypedHeader<XUserId>) -> AppResult<impl IntoResponse> {
    let db = database(&id.0).await?;
    tracing::info!("Querying Category for {}", id.0);
    let category = entity::category::Entity::find()
        .order_by_asc(entity::category::Column::Name)
        .all(&db)
        .await
        .map_err(|err| AppError::DbErr(err))?;
    Ok(Json(
        category
            .into_iter()
            .map(|c| Category {
                id: c.id,
                name: c.name,
                group: c.group,
                icon: c.icon,
            })
            .collect::<Vec<_>>(),
    ))
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
) -> AppResult<impl IntoResponse> {
    let db = database(&id.0).await?;
    tracing::info!("Querying Category for {}", id.0);
    entity::category::Entity::delete(entity::category::ActiveModel {
        id: ActiveValue::Set(category_id),
        ..Default::default()
    })
    .exec(&db)
    .await
    .map_err(|err| AppError::DbErr(err))?;
    Ok(())
}

#[axum::debug_handler]
#[utoipa::path(put, path = "/", params(XUserId),
    request_body = Category, responses(
    (status = OK, body = Category),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn put_category(
    TypedHeader(id): TypedHeader<XUserId>,
    Json(category): Json<Category>,
) -> AppResult<impl IntoResponse> {
    let db = database(&id.0).await?;
    tracing::info!("Querying Category for {}", id.0);
    let category = entity::category::Entity::insert(entity::category::ActiveModel {
        id: ActiveValue::Set(category.id),
        name: ActiveValue::Set(category.name.trim().to_owned()),
        group: ActiveValue::Set(category.group.trim().to_owned()),
        icon: ActiveValue::Set(category.icon.trim().to_owned()),
    })
    .on_conflict(
        OnConflict::column(entity::category::Column::Id)
            .update_columns([
                entity::category::Column::Name,
                entity::category::Column::Group,
                entity::category::Column::Icon,
            ])
            .to_owned(),
    )
    .exec(&db)
    .await
    .map_err(|err| AppError::DbErr(err))?;
    Ok(Json(category.last_insert_id))
}
