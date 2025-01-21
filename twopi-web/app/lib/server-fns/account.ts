import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { getWebRequest } from "vinxi/http";
import { z } from "zod";
import { AccountType } from "~/lib/hacks/account-type";
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
    const currency = await db.currency.findUnique({
      where: { code: data.currencyCode },
    });
    data.startingBalance =
      data.startingBalance * Math.pow(10, currency?.decimalDigits ?? 0);
    const value = await db.account.create({ data });
    return { success: true, value };
  });

export const createAccounts = createServerFn({ method: "POST" })
  .validator((accounts: unknown) =>
    z.array(createAccountValidator).parse(accounts),
  )
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({
      headers: getWebRequest().headers,
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const db = await getDbClient(session?.user);
    for (const item of data) {
      const currency = await db.currency.findUnique({
        where: { code: item.currencyCode },
      });
      item.startingBalance =
        item.startingBalance * Math.pow(10, currency?.decimalDigits ?? 0);
    }
    const value = await db.account.createMany({ data });
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
    return {
      accounts: (
        await db.account.findMany({
          include: {
            currency: true,
          },
        })
      ).map((account) => ({
        ...account,
        startingBalance:
          account.startingBalance /
          Math.pow(10, account.currency.decimalDigits),
      })),
    };
  },
);

export const getAccount = createServerFn({ method: "GET" })
  .validator((id: unknown) => z.string().parse(id))
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({
      headers: getWebRequest().headers,
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const db = await getDbClient(session?.user);
    const account = await db.account.findUnique({
      where: { id: data },
      include: {
        currency: true,
      },
    });
    if (!account) {
      throw notFound({ data: "Account not found" });
    }
    return {
      ...account,
      startingBalance:
        account.startingBalance / Math.pow(10, account.currency.decimalDigits),
    };
  });
