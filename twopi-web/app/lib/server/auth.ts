import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

export const auth = betterAuth({
  database: new Database(process.env.BETTER_AUTH_DB_URL ?? "file:/tmp/auth.db"),
  emailAndPassword: {
    enabled: true,
  },
});
