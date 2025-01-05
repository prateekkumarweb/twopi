import { LibsqlDialect } from "@libsql/kysely-libsql";
import { betterAuth } from "better-auth";

const dialect = new LibsqlDialect({
  url: process.env.AUTH_DATABASE_URL ?? "file:./auth.db",
  authToken: process.env.DATABASE_AUTH_TOKEN ?? "",
});

export const auth = betterAuth({
  database: {
    dialect,
    type: "sqlite",
  },
  emailAndPassword: {
    enabled: true,
  },
});
