# TwoPi service

```sh
# Generate migration
$ sea-orm-cli migrate generate <migration_name>
# Migrate
$ DATABASE_URL='sqlite://../data/dev.sqlite?mode=rwc' sea-orm-cli migrate
# Generate entities
$ DATABASE_URL='sqlite://../data/dev.sqlite?mode=rwc' sea-orm-cli generate entity -o src/entity --with-serde both
```
