import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

export const auth = betterAuth({
  database: new Database(
    (process.env.TWOPI_DATA_DIR ?? "/tmp/data") + "/auth.db",
  ),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }) => {
      console.log(
        "Email verification URL:",
        url,
        "for user",
        user,
        "with token",
        token,
      );
    },
  },
});
