use axum::{
    Json,
    extract::{Path, Query},
};
use sea_orm::prelude::Uuid;
use serde::Deserialize;
use utoipa::IntoParams;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::{
    AppError, AppResult, ValidatedJson, XUserId, database,
    model::account::{AccountModel, AccountWithCurrency, AccountWithTransactions, NewAccountModel},
};

pub fn router() -> OpenApiRouter<()> {
    OpenApiRouter::new()
        .routes(routes![account, put_account, delete_account])
        .routes(routes![put_accounts])
        .routes(routes![account_by_id])
}

#[tracing::instrument]
#[utoipa::path(get, path = "/", responses(
    (status = OK, body = Vec<AccountWithCurrency>),
    AppError
))]
async fn account(id: XUserId) -> AppResult<Json<Vec<AccountWithCurrency>>> {
    let db = database(&id.0).await?;
    Ok(Json(AccountWithCurrency::find_all(&db).await?))
}

#[tracing::instrument]
#[utoipa::path(get, path = "/{account_id}", params(("account_id" = Uuid, Path)), responses(
    (status = OK, body = Option<AccountWithTransactions>),
    AppError
))]
async fn account_by_id(
    id: XUserId,
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

#[tracing::instrument]
#[utoipa::path(delete, path = "/", params(DeleteAccountParams), responses(
    (status = OK, body = ()),
    AppError
))]
async fn delete_account(
    id: XUserId,
    Query(DeleteAccountParams { id: account_id }): Query<DeleteAccountParams>,
) -> AppResult<()> {
    let db = database(&id.0).await?;
    AccountModel::delete(&db, account_id).await?;
    Ok(())
}

#[tracing::instrument(skip(account))]
#[utoipa::path(put, path = "/",
    request_body = NewAccountModel, responses(
    (status = OK, body = Uuid),
    AppError
))]
async fn put_account(
    id: XUserId,
    ValidatedJson(account): ValidatedJson<NewAccountModel>,
) -> AppResult<Json<Uuid>> {
    let db = database(&id.0).await?;
    let id = AccountModel::upsert(account, &db).await?;
    Ok(Json(id))
}

#[tracing::instrument(skip(accounts))]
#[utoipa::path(put, path = "/import",
    request_body = Vec<NewAccountModel>, responses(
    (status = OK, body = ()),
    AppError
))]
async fn put_accounts(
    id: XUserId,
    ValidatedJson(accounts): ValidatedJson<Vec<NewAccountModel>>,
) -> AppResult<()> {
    let db = database(&id.0).await?;
    AccountModel::upsert_many(accounts, &db).await?;
    Ok(())
}
