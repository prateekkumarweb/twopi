import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { v7 as uuidv7 } from "uuid";
import { getWebRequest } from "vinxi/http";
import { z } from "zod";
import { apiClient } from "../openapi";
import { auth } from "../server/auth";

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
    const accounts = await apiClient.GET("/account", {
      params: {
        header: {
          "x-user-id": session.user.id,
        },
      },
    });
    if (accounts.error) {
      throw new Error(accounts.error);
    }
    const categories = await apiClient.GET("/category", {
      params: {
        header: {
          "x-user-id": session.user.id,
        },
      },
    });
    if (categories.error) {
      throw new Error(categories.error);
    }
    const txId = uuidv7();
    const { error } = await apiClient.PUT("/transaction", {
      params: {
        header: {
          "x-user-id": session.user.id,
        },
      },
      body: {
        id: txId,
        title: data.name,
        transaction_items: data.transactions.map((transaction) => ({
          id: uuidv7(),
          notes: transaction.notes,
          account_id: transaction.accountId,
          transaction_id: txId,
          amount:
            transaction.amount *
            Math.pow(
              10,
              accounts?.data?.find((a) => a.id === transaction.accountId)
                ?.currency.decimal_digits ?? 0,
            ),
          category_id: categories?.data?.find(
            (c) => c.name === transaction.categoryName,
          )?.id,
        })),
        timestamp: (data.timestamp ?? new Date()).toISOString(),
      },
    });
    if (error) {
      throw new Error(error);
    }
    return { success: true };
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
    const accounts = await apiClient.GET("/account", {
      params: {
        header: {
          "x-user-id": session.user.id,
        },
      },
    });
    if (accounts.error) {
      throw new Error(accounts.error);
    }
    const categories = await apiClient.GET("/category", {
      params: {
        header: {
          "x-user-id": session.user.id,
        },
      },
    });
    if (categories.error) {
      throw new Error(categories.error);
    }
    const { error } = await apiClient.PUT("/transaction/import", {
      params: {
        header: {
          "x-user-id": session.user.id,
        },
      },
      body: data.map((transaction) => {
        const txId = uuidv7();
        return {
          id: txId,
          title: transaction.name,
          transaction_items: transaction.transactions.map(
            (transactionItem) => ({
              id: uuidv7(),
              notes: transactionItem.notes,
              account_id: transactionItem.accountId,
              transaction_id: txId,
              amount:
                transactionItem.amount *
                Math.pow(
                  10,
                  accounts?.data?.find(
                    (a) => a.id === transactionItem.accountId,
                  )?.currency.decimal_digits ?? 0,
                ),
              category_id: categories?.data?.find(
                (c) => c.name === transactionItem.categoryName,
              )?.id,
            }),
          ),
          timestamp: (transaction.timestamp ?? new Date()).toISOString(),
        };
      }),
    });
    if (error) {
      throw new Error(error);
    }
    return { success: true };
  });

export const getTransactions = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await auth.api.getSession({
      headers: getWebRequest().headers,
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const { data, error } = await apiClient.GET("/transaction", {
      params: {
        header: {
          "x-user-id": session.user.id,
        },
      },
    });
    if (error) {
      throw new Error(error);
    }
    return { transactions: data };
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
    const { data: transaction, error } = await apiClient.GET(
      "/transaction/{transaction_id}",
      {
        params: {
          header: {
            "x-user-id": session.user.id,
          },
          path: {
            transaction_id: data,
          },
        },
      },
    );
    if (error) {
      throw new Error(error);
    }
    if (!transaction) {
      throw notFound({ data: "Account not found" });
    }
    return {
      ...transaction,
      transaction_items: transaction?.transaction_items?.map(
        (transactionItem) => ({
          ...transactionItem,
          amount:
            transactionItem.amount /
            Math.pow(10, transactionItem.account.currency.decimal_digits ?? 0),
          account: {
            ...transactionItem.account,
          },
        }),
      ),
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
    const { error } = await apiClient.DELETE(`/transaction/item`, {
      params: {
        header: {
          "x-user-id": session.user.id,
        },
        query: {
          id: data,
        },
      },
    });
    if (error) {
      throw new Error(error);
    }
    return { success: true };
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
    const { error } = await apiClient.DELETE(`/transaction`, {
      params: {
        header: {
          "x-user-id": session.user.id,
        },
        query: {
          id: data,
        },
      },
    });
    if (error) {
      throw new Error(error);
    }
    return { success: true };
  });
