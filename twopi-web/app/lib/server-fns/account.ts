import { createServerFn } from "@tanstack/start";
import { z } from "zod";
import { auth } from "../server/auth";
import { getWebRequest } from "vinxi/http";
import { getDbClient } from "../server/db";

const createAccountValidator = z.object({
  name: z.string(),
  accountType: z.enum([
    "savings",
    "current",
    "loan",
    "credit",
    "wallet",
    "person",
  ]),
  currencyCode: z.string(),
  startingBalance: z.number().default(0),
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
    await db.account.create({ data });
    return { success: true };
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
