# TwoPi

## How to use?

`.env` file

```txt
TWOPI_DATA_DIR=../data
TWOPI_API_URL=http://localhost:8000
TWOPI_SECRET_KEY=<twopi_secret_key>
CURRENCY_API_KEY=<currency_api_key>
```

```sh
$ cd twopi-web
$ pnpm install
$ pnpm run dev
# Build for production
$ pnpm run build
$ pnpm run preview
```

Running `twopi-service`:

```sh
$ cd twopi-service
$ source .env
$ RUST_LOG=debug cargo run --release
```

Migration:

```sh
$ cd twopi-service
# Generate migration
$ sea-orm-cli migrate generate <migration_name>
# Migrate
$ DATABASE_URL='sqlite://../data/dev.sqlite?mode=rwc' sea-orm-cli migrate
# Generate entities
$ DATABASE_URL='sqlite://../data/dev.sqlite?mode=rwc' sea-orm-cli generate entity -o src/entity --with-serde both --model-extra-derives utoipa::ToSchema
```

User Migration:

```sh
$ cd twopi-service
# Generate migration
$ sea-orm-cli migrate generate <migration_name> -d user-migration
# Migrate
$ DATABASE_URL='sqlite://../data/auth.sqlite?mode=rwc' sea-orm-cli migrate -d user-migration
# Generate entities
$ DATABASE_URL='sqlite://../data/auth.sqlite?mode=rwc' sea-orm-cli generate entity -o src/user_entity --with-serde both
```
