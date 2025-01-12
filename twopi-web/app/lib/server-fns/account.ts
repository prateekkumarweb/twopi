import { AccountType } from "@prisma/client";
import { createServerFn } from "@tanstack/start";
import { getWebRequest } from "vinxi/http";
import { z } from "zod";
import { auth } from "../server/auth";
import { getDbClient } from "../server/db";

const createAccountValidator = z.object({
  name: z.string(),
  accountType: z.nativeEnum(AccountType),
  currencyCode: z.string(),
  startingBalance: z.number().default(0),
  createdAt: z.date().optional(),
});

export const createAccount = createServerFn({ method: "POST" })
  .validator((account: unknown) => createAccountValidator.parse(account))
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({
      headers: getWebRequest().headers,
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const db = await getDbClient(session?.user);
    const value = await db.account.create({ data });
    return { success: true, value };
  });

export const getAccounts = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await auth.api.getSession({
      headers: getWebRequest().headers,
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const db = await getDbClient(session?.user);
    return { accounts: await db.account.findMany() };
  },
);
