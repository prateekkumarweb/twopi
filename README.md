# TwoPi

## How to use?

`.env` file

```txt
BASE_URL=http://localhost:3000
BETTER_AUTH_SECRET=<auth_secret>
TURSO_DATABASE_URL=libsql://localhost:8080?tls=0
TURSO_AUTH_TOKEN=<secret_token>
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
