use sea_orm::{EnumIter, Iterable};
use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Currency::Table)
                    .if_not_exists()
                    .col(string(Currency::Code).primary_key())
                    .col(string(Currency::Name))
                    .col(integer(Currency::DecimalDigits))
                    .to_owned(),
            )
            .await?;
        manager
            .create_table(
                Table::create()
                    .table(Account::Table)
                    .if_not_exists()
                    .col(uuid(Account::Id).primary_key())
                    .col(string(Account::Name).unique_key())
                    .col(enumeration(
                        Account::AccountType,
                        Alias::new("account_type"),
                        AccountType::iter(),
                    ))
                    .col(uuid(Account::CurrencyCode))
                    .col(big_integer(Account::StartingBalance).default("0"))
                    .col(date_time(Account::CreatedAt).default("CURRENT_TIMESTAMP"))
                    .col(json(Account::AccountExtra))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_account_currency_code")
                            .from(Account::Table, Account::CurrencyCode)
                            .to(Currency::Table, Currency::Code)
                            .on_delete(ForeignKeyAction::Restrict)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;
        manager
            .create_table(
                Table::create()
                    .table(Category::Table)
                    .if_not_exists()
                    .col(uuid(Category::Id).primary_key())
                    .col(string(Category::Name).unique_key())
                    .col(string(Category::Group))
                    .col(string(Category::Icon))
                    .to_owned(),
            )
            .await?;
        manager
            .create_table(
                Table::create()
                    .table(Transaction::Table)
                    .if_not_exists()
                    .col(uuid(Transaction::Id).primary_key())
                    .col(string(Transaction::Title))
                    .col(date_time(Transaction::Timestamp).default("CURRENT_TIMESTAMP"))
                    .to_owned(),
            )
            .await?;
        manager
            .create_table(
                Table::create()
                    .table(TransactionItem::Table)
                    .if_not_exists()
                    .col(uuid(TransactionItem::Id).primary_key())
                    .col(string(TransactionItem::Notes))
                    .col(uuid(TransactionItem::TransactionId))
                    .col(uuid(TransactionItem::AccountId))
                    .col(uuid_null(TransactionItem::CategoryId))
                    .col(big_integer(TransactionItem::Amount))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_transaction_item_transaction_id")
                            .from(TransactionItem::Table, TransactionItem::TransactionId)
                            .to(Transaction::Table, Transaction::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_transaction_item_account_id")
                            .from(TransactionItem::Table, TransactionItem::AccountId)
                            .to(Account::Table, Account::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_transaction_item_category_id")
                            .from(TransactionItem::Table, TransactionItem::CategoryId)
                            .to(Category::Table, Category::Id)
                            .on_delete(ForeignKeyAction::SetNull)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Currency::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Account::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Category::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Transaction::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(TransactionItem::Table).to_owned())
            .await?;
        Ok(())
    }
}

#[derive(DeriveIden)]
enum Currency {
    Table,
    Code,
    Name,
    DecimalDigits,
}

#[derive(Iden, EnumIter)]
enum AccountType {
    Cash,
    Wallet,
    Bank,
    CreditCard,
    Loan,
    Person,
}

#[derive(DeriveIden)]
enum Account {
    Table,
    Id,
    Name,
    AccountType,
    CurrencyCode,
    StartingBalance,
    CreatedAt,
    AccountExtra,
}

#[derive(DeriveIden)]
enum Category {
    Table,
    Id,
    Name,
    Group,
    Icon,
}

#[derive(DeriveIden)]
enum Transaction {
    Table,
    Id,
    Title,
    Timestamp,
}

#[derive(DeriveIden)]
enum TransactionItem {
    Table,
    Id,
    Notes,
    TransactionId,
    AccountId,
    CategoryId,
    Amount,
}
