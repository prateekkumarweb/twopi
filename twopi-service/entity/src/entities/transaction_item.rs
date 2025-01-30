//! `SeaORM` Entity, @generated by sea-orm-codegen 1.1.0

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "transaction_item")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub notes: String,
    pub transaction_id: Uuid,
    pub account_id: Uuid,
    pub category_id: Option<Uuid>,
    pub amount: i32,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::account::Entity",
        from = "Column::AccountId",
        to = "super::account::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    Account,
    #[sea_orm(
        belongs_to = "super::category::Entity",
        from = "Column::CategoryId",
        to = "super::category::Column::Id",
        on_update = "Cascade",
        on_delete = "SetNull"
    )]
    Category,
    #[sea_orm(
        belongs_to = "super::transaction::Entity",
        from = "Column::TransactionId",
        to = "super::transaction::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    Transaction,
}

impl Related<super::account::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Account.def()
    }
}

impl Related<super::category::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Category.def()
    }
}

impl Related<super::transaction::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Transaction.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
