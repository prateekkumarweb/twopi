# TwoPi

## How to use?

`.env` file

```txt
BASE_URL=http://localhost:3000
BETTER_AUTH_SECRET=<auth_secret>
TWOPI_DATA_DIR=../data
TWOPI_API_URL=http://localhost:8000
CURRENCY_API_KEY=<currency_api_key>
```

```sh
$ cd twopi-web
$ pnpm install
$ pnpm dlx @better-auth/cli migrate # migrate db used for auth
$ pnpm run dev
# Build for production
$ pnpm run build
$ pnpm run start
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
$ DATABASE_URL='sqlite://../data/dev.sqlite?mode=rwc' sea-orm-cli generate entity -o src/entity --with-serde both
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
