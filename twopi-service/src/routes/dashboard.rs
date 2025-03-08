use std::collections::HashMap;

use axum::Json;
use chrono::Datelike;
use serde::Serialize;
use utoipa::ToSchema;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::{
    XUserId,
    error::{AppError, AppResult},
    model::{category::CategoryModel, transaction::TransactionModel},
};

pub fn router() -> OpenApiRouter<()> {
    OpenApiRouter::new().routes(routes![dashboard])
}

#[derive(Serialize, ToSchema)]
struct DashboardResponse {
    last_3m: [(u32, i32); 3],
    categoies_last_3m: HashMap<String, [HashMap<String, f64>; 3]>,
}

#[tracing::instrument]
#[utoipa::path(get, path = "/", responses(
    (status = OK, body = DashboardResponse),
    AppError
))]
#[axum::debug_handler]
async fn dashboard(id: XUserId) -> AppResult<Json<DashboardResponse>> {
    let db = crate::database(&id.0).await?;
    let all_categories = CategoryModel::find_all(&db).await?;
    let mut categories = all_categories
        .into_iter()
        .map(|c| {
            (
                c.name().to_owned(),
                [HashMap::new(), HashMap::new(), HashMap::new()],
            )
        })
        .collect::<HashMap<_, _>>();
    let now = chrono::Utc::now();
    let current_month_year = (now.month(), now.year());
    let next_month_year = if now.month() == 12 {
        (1, now.year() + 1)
    } else {
        (now.month() + 1, now.year())
    };
    let prev_month_year = if now.month() == 1 {
        (12, now.year() - 1)
    } else {
        (now.month() - 1, now.year())
    };
    let prev_prev_month_year = if prev_month_year.0 == 1 {
        (12, prev_month_year.1 - 1)
    } else {
        (prev_month_year.0 - 1, prev_month_year.1)
    };
    #[allow(clippy::unwrap_used)]
    let current_timestamp =
        chrono::NaiveDate::from_ymd_opt(current_month_year.1, current_month_year.0, 1)
            .unwrap()
            .and_hms_opt(0, 0, 0)
            .unwrap()
            .and_utc();
    #[allow(clippy::unwrap_used)]
    let next_timestamp = chrono::NaiveDate::from_ymd_opt(next_month_year.1, next_month_year.0, 1)
        .unwrap()
        .and_hms_opt(0, 0, 0)
        .unwrap()
        .and_utc();
    #[allow(clippy::unwrap_used)]
    let prev_timestamp = chrono::NaiveDate::from_ymd_opt(prev_month_year.1, prev_month_year.0, 1)
        .unwrap()
        .and_hms_opt(0, 0, 0)
        .unwrap()
        .and_utc();
    #[allow(clippy::unwrap_used)]
    let prev_prev_timestamp =
        chrono::NaiveDate::from_ymd_opt(prev_prev_month_year.1, prev_prev_month_year.0, 1)
            .unwrap()
            .and_hms_opt(0, 0, 0)
            .unwrap()
            .and_utc();
    let current_transactions =
        TransactionModel::find_by_month(&db, current_timestamp, next_timestamp).await?;
    let prev_transactions =
        TransactionModel::find_by_month(&db, prev_timestamp, current_timestamp).await?;
    let prev_prev_transactions =
        TransactionModel::find_by_month(&db, prev_prev_timestamp, prev_timestamp).await?;
    for t in current_transactions {
        let items = t.items();
        for i in items {
            let Some(category) = i.category() else {
                continue;
            };
            let (amount, currency) = i.amount();
            #[allow(clippy::unwrap_used)]
            let entry = categories.get_mut(category.name()).unwrap();
            #[allow(clippy::cast_precision_loss)]
            let amount = amount as f64 / 10_f64.powi(currency.decimal_digits());
            let value = entry[2].entry(currency.code().to_string()).or_insert(0.0);
            *value += amount;
        }
    }
    for t in prev_transactions {
        let items = t.items();
        for i in items {
            let Some(category) = i.category() else {
                continue;
            };
            let (amount, currency) = i.amount();
            #[allow(clippy::unwrap_used)]
            let entry = categories.get_mut(category.name()).unwrap();
            #[allow(clippy::cast_precision_loss)]
            let amount = amount as f64 / 10_f64.powi(currency.decimal_digits());
            let value = entry[1].entry(currency.code().to_string()).or_insert(0.0);
            *value += amount;
        }
    }
    for t in prev_prev_transactions {
        let items = t.items();
        for i in items {
            let Some(category) = i.category() else {
                continue;
            };
            let (amount, currency) = i.amount();
            #[allow(clippy::unwrap_used)]
            let entry = categories.get_mut(category.name()).unwrap();
            #[allow(clippy::cast_precision_loss)]
            let amount = amount as f64 / 10_f64.powi(currency.decimal_digits());
            let value = entry[0].entry(currency.code().to_string()).or_insert(0.0);
            *value += amount;
        }
    }

    Ok(Json(DashboardResponse {
        last_3m: [
            (prev_prev_month_year.0, prev_prev_month_year.1),
            (prev_month_year.0, prev_month_year.1),
            (current_month_year.0, current_month_year.1),
        ],
        categoies_last_3m: categories,
    }))
}
