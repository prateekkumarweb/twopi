import { createServerFn } from "@tanstack/start";
import { getWebRequest } from "vinxi/http";
import { z } from "zod";
import { auth } from "../server/auth";
import { getDbClient } from "../server/db";

const createTransactionValidtor = z.object({
  name: z.string(),
  categoryName: z.string(),
  transactions: z.array(
    z.object({
      name: z.string(),
      accountId: z.string(),
      amount: z.number(),
      currencyCode: z.string(),
      currencyAmount: z.number(),
    }),
  ),
  timestamp: z.date().optional(),
});

export const createTransaction = createServerFn({ method: "POST" })
  .validator((transaction: unknown) => {
    return createTransactionValidtor.parse(transaction);
  })
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({
      headers: getWebRequest().headers,
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const db = await getDbClient(session?.user);
    const value = await db.transaction.create({
      data: {
        name: data.name,
        categoryName: data.categoryName,
        transactions: {
          create: data.transactions,
        },
        timestamp: data.timestamp,
      },
    });
    return { success: true, value };
  });

export const getTransactions = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await auth.api.getSession({
      headers: getWebRequest().headers,
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const db = await getDbClient(session?.user);
    return {
      transactions: await db.transaction.findMany({
        include: {
          transactions: {
            include: {
              account: true,
            },
          },
          category: true,
        },
      }),
    };
  },
);

export const deleteTransactionItem = createServerFn({
  method: "POST",
})
  .validator((id: unknown) => {
    return z.string().parse(id);
  })
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({
      headers: getWebRequest().headers,
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const db = await getDbClient(session?.user);
    const value = await db.transactionItem.delete({
      where: {
        id: data,
      },
    });
    return { success: true, value };
  });

export const deleteTransaction = createServerFn({
  method: "POST",
})
  .validator((id: unknown) => {
    return z.string().parse(id);
  })
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({
      headers: getWebRequest().headers,
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const db = await getDbClient(session?.user);
    const value = await db.transaction.delete({
      where: {
        id: data,
      },
    });
    return { success: true, value };
  });
