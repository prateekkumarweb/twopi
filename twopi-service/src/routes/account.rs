use axum::{
    extract::{Path, Query},
    Json,
};
use axum_extra::TypedHeader;
use sea_orm::prelude::Uuid;
use serde::Deserialize;
use utoipa::IntoParams;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::{
    database,
    model::account::{AccountModel, AccountWithCurrency, AccountWithTransactions, NewAccountModel},
    AppResult, XUserId,
};

pub fn router() -> OpenApiRouter<()> {
    OpenApiRouter::new()
        .routes(routes![account, put_account, delete_account])
        .routes(routes![put_accounts])
        .routes(routes![account_by_id])
}

#[axum::debug_handler]
#[utoipa::path(get, path = "/", params(XUserId), responses(
    (status = OK, body = Vec<AccountWithCurrency>),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn account(
    TypedHeader(id): TypedHeader<XUserId>,
) -> AppResult<Json<Vec<AccountWithCurrency>>> {
    let db = database(&id.0).await?;
    Ok(Json(AccountWithCurrency::find_all(&db).await?))
}

#[axum::debug_handler]
#[utoipa::path(get, path = "/{account_id}", params(XUserId, ("account_id" = Uuid, Path)), responses(
    (status = OK, body = Option<AccountWithTransactions>),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn account_by_id(
    TypedHeader(id): TypedHeader<XUserId>,
    Path(account_id): Path<Uuid>,
) -> AppResult<Json<Option<AccountWithTransactions>>> {
    let db = database(&id.0).await?;
    Ok(Json(
        AccountWithTransactions::find_by_id(&db, account_id).await?,
    ))
}

#[derive(Deserialize, IntoParams)]
struct DeleteAccountParams {
    #[into_params(names("id"), parameter_in = Query)]
    id: Uuid,
}

#[axum::debug_handler]
#[utoipa::path(delete, path = "/", params(XUserId, DeleteAccountParams), responses(
    (status = OK, body = ()),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn delete_account(
    TypedHeader(id): TypedHeader<XUserId>,
    Query(DeleteAccountParams { id: account_id }): Query<DeleteAccountParams>,
) -> AppResult<()> {
    let db = database(&id.0).await?;
    AccountModel::delete(&db, account_id).await?;
    Ok(())
}

#[axum::debug_handler]
#[utoipa::path(put, path = "/", params(XUserId),
    request_body = NewAccountModel, responses(
    (status = OK, body = Uuid),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn put_account(
    TypedHeader(id): TypedHeader<XUserId>,
    Json(account): Json<NewAccountModel>,
) -> AppResult<Json<Uuid>> {
    let db = database(&id.0).await?;
    let id = AccountModel::upsert(account, &db).await?;
    Ok(Json(id))
}

#[axum::debug_handler]
#[utoipa::path(put, path = "/import", params(XUserId),
    request_body = Vec<NewAccountModel>, responses(
    (status = OK, body = ()),
    (status = INTERNAL_SERVER_ERROR, body = String)
))]
async fn put_accounts(
    TypedHeader(id): TypedHeader<XUserId>,
    Json(accounts): Json<Vec<NewAccountModel>>,
) -> AppResult<()> {
    let db = database(&id.0).await?;
    AccountModel::upsert_many(accounts, &db).await?;
    Ok(())
}
