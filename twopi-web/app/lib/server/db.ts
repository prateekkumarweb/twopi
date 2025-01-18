import { PrismaClient } from "@prisma/client";
import { type User } from "better-auth";
import { exec } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import util from "node:util";

const execAsync = util.promisify(exec);

function getDbName(user: User) {
  return Buffer.from(user.id).toString("base64");
}

export async function getDbClient(user: User) {
  const dbDir = process.env.TWOPI_DATA_DIR ?? "/tmp/data";
  const base = resolve(dbDir, "database");
  const url = `file:${base}/${getDbName(user)}.db`;
  console.log("Database", url);
  if (!existsSync(`${base}/${getDbName(user)}.db`)) {
    const output = await execAsync(
      `DATABASE_URL=${url} pnpm dlx prisma migrate deploy`,
    );
    console.log(output);
  }
  const prisma = new PrismaClient({ datasourceUrl: url });
  return prisma;
}
