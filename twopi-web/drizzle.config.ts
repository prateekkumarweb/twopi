import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "turso",
  schema: "./app/db/schema.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
