# TwoPi service

```sh
# Generate migration
$ sea-orm-cli migrate generate <migration_name>
# Generate entities
$ DATABASE_URL='sqlite://../data/dev.sqlite?mode=rwc' sea-orm-cli generate entity -o entity/src/entities --with-serde both
```
