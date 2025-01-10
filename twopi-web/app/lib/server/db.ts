import { PrismaClient } from "@prisma/client";
import { User } from "better-auth";
import util from "node:util";
import { exec } from "node:child_process";
import { existsSync } from "node:fs";

const execAsync = util.promisify(exec);

function getDbName(user: User) {
  return Buffer.from(user.id).toString("base64");
}

export async function getDbClient(user: User) {
  const base = process.env.DATABASE_ABS_PATH ?? "/tmp/database";
  const url = `file:${base}/${getDbName(user)}.db`;
  console.log("Database", url);
  if (!existsSync(`${base}/${getDbName(user)}.db`)) {
    const output = await execAsync(
      `DATABASE_URL=${url} npx prisma migrate deploy`,
    );
    console.log(output);
  }
  const prisma = new PrismaClient({ datasourceUrl: url });
  return prisma;
}
