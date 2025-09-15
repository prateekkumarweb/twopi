# Khata

## How to use?

`.env` file

```txt
KHATA_DATA_DIR=../data
KHATA_API_URL=http://localhost:8000
KHATA_SECRET_KEY=<khata_secret_key>
CURRENCY_API_KEY=<currency_api_key>
```

```sh
$ cd khata-ui
$ pnpm install
$ pnpm run dev
# Build for production
$ pnpm run build
$ pnpm run preview
```

Running `khata-service`:

```sh
$ cd khata-service
$ source .env
$ RUST_LOG=debug cargo run --release
```

Migration:

```sh
$ cd khata-service
# Generate migration
$ sea-orm-cli migrate generate <migration_name>
# Migrate
$ DATABASE_URL='sqlite://../data/dev.sqlite?mode=rwc' sea-orm-cli migrate
# Generate entities
$ DATABASE_URL='sqlite://../data/dev.sqlite?mode=rwc' sea-orm-cli generate entity -o src/entity --with-serde both --model-extra-derives utoipa::ToSchema
```

User Migration:

```sh
$ cd khata-service
# Generate migration
$ sea-orm-cli migrate generate <migration_name> -d user-migration
# Migrate
$ DATABASE_URL='sqlite://../data/auth.sqlite?mode=rwc' sea-orm-cli migrate -d user-migration
# Generate entities
$ DATABASE_URL='sqlite://../data/auth.sqlite?mode=rwc' sea-orm-cli generate entity -o src/user_entity --with-serde both
```
