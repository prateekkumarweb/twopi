import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { z } from "zod";
import { apiClient } from "../openapi";
import { authMiddleware } from "../server/utils";

const createTransactionValidtor = z.object({
  id: z.string().optional(),
  title: z.string(),
  transactions: z.array(
    z.object({
      id: z.string().optional(),
      notes: z.string(),
      accountName: z.string(),
      amount: z.number(),
      categoryName: z.string().optional(),
    }),
  ),
  timestamp: z.date().optional(),
});

export const createTransaction = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((transaction: unknown) => {
    return createTransactionValidtor.parse(transaction);
  })
  .handler(async ({ data, context }) => {
    const accounts = await apiClient.GET("/twopi-api/account", {
      params: {
        header: {
          "x-user-id": context.userId,
        },
      },
    });
    if (accounts.error) {
      throw new Error(accounts.error);
    }
    const categories = await apiClient.GET("/twopi-api/category", {
      params: {
        header: {
          "x-user-id": context.userId,
        },
      },
    });
    if (categories.error) {
      throw new Error(categories.error);
    }

    const { error } = await apiClient.PUT("/twopi-api/transaction", {
      params: {
        header: {
          "x-user-id": context.userId,
        },
      },
      body: {
        id: data.id,
        title: data.title,
        transaction_items: data.transactions.map((transaction) => ({
          id: transaction.id,
          notes: transaction.notes,
          account_name: transaction.accountName,
          amount: Math.round(
            transaction.amount *
              Math.pow(
                10,
                accounts?.data?.find((a) => a.name === transaction.accountName)
                  ?.currency.decimal_digits ?? 0,
              ),
          ),
          category_name: transaction.categoryName,
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
  .middleware([authMiddleware])
  .validator((transactions: unknown) =>
    z.array(createTransactionValidtor).parse(transactions),
  )
  .handler(async ({ data, context }) => {
    const accounts = await apiClient.GET("/twopi-api/account", {
      params: {
        header: {
          "x-user-id": context.userId,
        },
      },
    });
    if (accounts.error) {
      throw new Error(accounts.error);
    }
    const categories = await apiClient.GET("/twopi-api/category", {
      params: {
        header: {
          "x-user-id": context.userId,
        },
      },
    });
    if (categories.error) {
      throw new Error(categories.error);
    }
    const { error } = await apiClient.PUT("/twopi-api/transaction/import", {
      params: {
        header: {
          "x-user-id": context.userId,
        },
      },
      body: data.map((transaction) => {
        return {
          id: transaction.id,
          title: transaction.title,
          transaction_items: transaction.transactions.map(
            (transactionItem) => ({
              id: transactionItem.id,
              notes: transactionItem.notes,
              account_name: transactionItem.accountName,
              amount: Math.round(
                transactionItem.amount *
                  Math.pow(
                    10,
                    accounts?.data?.find(
                      (a) => a.name === transactionItem.accountName,
                    )?.currency.decimal_digits ?? 0,
                  ),
              ),
              category_name: transactionItem.categoryName,
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

export const getTransactions = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { data, error } = await apiClient.GET("/twopi-api/transaction", {
      params: {
        header: {
          "x-user-id": context.userId,
        },
      },
    });
    if (error) {
      throw new Error(error);
    }
    return {
      transactions: data?.map((tx) => ({
        ...tx,
        transaction_items: tx?.transaction_items?.map((transactionItem) => ({
          ...transactionItem,
          amount:
            transactionItem.amount /
            Math.pow(10, transactionItem.account.currency.decimal_digits ?? 0),
        })),
      })),
    };
  });

export const getTransaction = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.string().parse(id))
  .handler(async ({ data, context }) => {
    const { data: transaction, error } = await apiClient.GET(
      "/twopi-api/transaction/{transaction_id}",
      {
        params: {
          header: {
            "x-user-id": context.userId,
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
  .middleware([authMiddleware])
  .validator((id: unknown) => {
    return z.string().parse(id);
  })
  .handler(async ({ data, context }) => {
    const { error } = await apiClient.DELETE(`/twopi-api/transaction/item`, {
      params: {
        header: {
          "x-user-id": context.userId,
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
  .middleware([authMiddleware])
  .validator((id: unknown) => {
    return z.string().parse(id);
  })
  .handler(async ({ data, context }) => {
    const { error } = await apiClient.DELETE(`/twopi-api/transaction`, {
      params: {
        header: {
          "x-user-id": context.userId,
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
