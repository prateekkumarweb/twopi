# TwoPi

## How to use?

`.env` file

```txt
BASE_URL=http://localhost:3000
BETTER_AUTH_SECRET=<auth_secret>
TURSO_AUTH_DATABASE_URL=libsql://localhost:8080?tls=0
TURSO_AUTH_TOKEN=<secret_token>
DATABASE_ABS_PATH=/tmp/database
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

Running `currency-cache`:

```sh
$ cd currency-cache
$ CURRENCY_DATA=data CURRENCY_API_KEY=abcxyz RUST_LOG=debug cargo run --release
```
