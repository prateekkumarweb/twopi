# TwoPi

## How to use?

`.env` file

```txt
BASE_URL=http://localhost:3000
BETTER_AUTH_SECRET=<auth_secret>
TWOPI_DATA_DIR=../data
CURRENCY_CACHE_URL=http://localhost:4670
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

Running `currency-cache`:

```sh
$ cd currency-cache
$ source .env
$ RUST_LOG=debug cargo run --release
```
