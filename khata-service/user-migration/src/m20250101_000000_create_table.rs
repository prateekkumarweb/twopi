use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(User::Table)
                    .if_not_exists()
                    .col(uuid(User::Id).primary_key())
                    .col(string(User::Name))
                    .col(string(User::Email).unique_key())
                    .col(string(User::PasswordHash))
                    .col(boolean(User::EmailVerified).default("false"))
                    .col(timestamp(User::CreatedAt).default("CURRENT_TIMESTAMP"))
                    .col(json_binary_null(User::Settings))
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(User::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum User {
    Table,
    Id,
    Name,
    Email,
    PasswordHash,
    EmailVerified,
    CreatedAt,
    Settings,
}
