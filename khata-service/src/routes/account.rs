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
    model::account::{AccountExpandedModel, AccountReq},
};

pub fn router() -> OpenApiRouter<()> {
    OpenApiRouter::new()
        .routes(routes![account, put_account, delete_account])
        .routes(routes![put_accounts])
        .routes(routes![account_by_id])
}

#[tracing::instrument]
#[utoipa::path(get, path = "/", responses(
    (status = OK, body = Vec<AccountExpandedModel>),
    AppError
))]
async fn account(id: XUserId) -> AppResult<Json<Vec<AccountExpandedModel>>> {
    let db = database(&id.0).await?;
    Ok(Json(AccountReq::find_all_with_currency(&db).await?))
}

#[tracing::instrument]
#[utoipa::path(get, path = "/{account_id}", params(("account_id" = Uuid, Path)), responses(
    (status = OK, body = Option<AccountExpandedModel>),
    AppError
))]
async fn account_by_id(
    id: XUserId,
    Path(account_id): Path<Uuid>,
) -> AppResult<Json<Option<AccountExpandedModel>>> {
    let db = database(&id.0).await?;
    Ok(Json(
        AccountReq::find_one_with_currency(&db, account_id).await?,
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
    AccountReq::delete(&db, account_id).await?;
    Ok(())
}

#[tracing::instrument(skip(account))]
#[utoipa::path(put, path = "/",
    request_body = AccountReq, responses(
    (status = OK, body = Uuid),
    AppError
))]
async fn put_account(
    id: XUserId,
    ValidatedJson(account): ValidatedJson<AccountReq>,
) -> AppResult<Json<Uuid>> {
    let db = database(&id.0).await?;
    let id = AccountReq::upsert(&db, account).await?;
    Ok(Json(id))
}

#[tracing::instrument(skip(accounts))]
#[utoipa::path(put, path = "/import",
    request_body = Vec<AccountReq>, responses(
    (status = OK, body = ()),
    AppError
))]
async fn put_accounts(
    id: XUserId,
    ValidatedJson(accounts): ValidatedJson<Vec<AccountReq>>,
) -> AppResult<()> {
    let db = database(&id.0).await?;
    AccountReq::upsert_many(&db, accounts).await?;
    Ok(())
}
