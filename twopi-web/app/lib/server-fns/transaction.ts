import { createServerFn } from "@tanstack/start";
import { getWebRequest } from "vinxi/http";
import { z } from "zod";
import { auth } from "../server/auth";
import { getDbClient } from "../server/db";

const createTransactionValidtor = z.object({
  name: z.string(),
  transactions: z.array(
    z.object({
      notes: z.string(),
      accountId: z.string(),
      amount: z.number(),
      categoryName: z.string().optional(),
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
    for (const transaction of data.transactions) {
      const account = await db.account.findUnique({
        where: { id: transaction.accountId },
        include: {
          currency: true,
        },
      });
      transaction.amount =
        transaction.amount * Math.pow(10, account?.currency.decimalDigits ?? 0);
      if (transaction.categoryName === "") {
        transaction.categoryName = undefined;
      }
    }
    const value = await db.transaction.create({
      data: {
        name: data.name,
        transactions: {
          create: data.transactions,
        },
        timestamp: data.timestamp,
      },
    });
    return { success: true, value };
  });

export const createTransactions = createServerFn({ method: "POST" })
  .validator((transactions: unknown) =>
    z.array(createTransactionValidtor).parse(transactions),
  )
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({
      headers: getWebRequest().headers,
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const db = await getDbClient(session?.user);
    for (const transaction of data) {
      for (const transactionItem of transaction.transactions) {
        const account = await db.account.findUnique({
          where: { id: transactionItem.accountId },
          include: {
            currency: true,
          },
        });
        transactionItem.amount =
          transactionItem.amount *
          Math.pow(10, account?.currency.decimalDigits ?? 0);
        if (transactionItem.categoryName === "") {
          transactionItem.categoryName = undefined;
        }
      }
    }
    const value = await db.$transaction([
      ...data
        .map((transaction) => ({
          name: transaction.name,
          transactions: {
            create: transaction.transactions,
          },
          timestamp: transaction.timestamp,
        }))
        .map((data) => db.transaction.create({ data })),
    ]);
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
      transactions: (
        await db.transaction.findMany({
          include: {
            transactions: {
              include: {
                account: {
                  include: {
                    currency: true,
                  },
                },
                category: true,
              },
            },
          },
        })
      ).map((transaction) => ({
        ...transaction,
        transactions: transaction.transactions.map((transactionItem) => ({
          ...transactionItem,
          amount:
            transactionItem.amount /
            Math.pow(10, transactionItem.account.currency.decimalDigits),
        })),
      })),
    };
  },
);

export const getTransaction = createServerFn({ method: "GET" })
  .validator((id: unknown) => z.string().parse(id))
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({
      headers: getWebRequest().headers,
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const db = await getDbClient(session?.user);
    const transaction = await db.transaction.findUnique({
      where: { id: data },
      include: {
        transactions: {
          include: {
            account: {
              include: {
                currency: true,
              },
            },
            category: true,
          },
        },
      },
    });
    return {
      ...transaction,
      transactions: transaction?.transactions.map((transactionItem) => ({
        ...transactionItem,
        amount:
          transactionItem.amount /
          Math.pow(10, transactionItem.account.currency.decimalDigits),
      })),
    };
  });

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
