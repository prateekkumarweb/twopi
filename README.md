# TwoPi

## How to use?

`.env` file

```txt
BASE_URL=http://localhost:3000
BETTER_AUTH_DB_URL=/tmp/auth.db
BETTER_AUTH_SECRET=<auth_secret>
DATABASE_ABS_PATH=/tmp/database
CURRENCY_CACHE_URL=http://localhost:4670
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
