#![allow(clippy::enum_variant_names)]

pub use sea_orm_migration::prelude::*;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![Box::new(m20250101_000000_create_table::Migration)]
    }
}

mod m20250101_000000_create_table;
