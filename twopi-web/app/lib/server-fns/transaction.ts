import { notFound } from "@tanstack/react-router";
import { apiClient } from "../openapi";

export async function createTransaction(transaction: {
  id?: string;
  title: string;
  transactions: {
    id?: string;
    notes: string;
    accountName: string;
    amount: number;
    categoryName?: string;
  }[];
  timestamp?: Date;
}) {
  const accounts = await apiClient.GET("/twopi-api/account");
  if (accounts.error) {
    throw new Error(accounts.error);
  }
  const categories = await apiClient.GET("/twopi-api/category");
  if (categories.error) {
    throw new Error(categories.error);
  }

  const { error } = await apiClient.PUT("/twopi-api/transaction", {
    body: {
      id: transaction.id,
      title: transaction.title,
      transaction_items: transaction.transactions.map((transaction) => ({
        id: transaction.id,
        notes: transaction.notes,
        account_name: transaction.accountName,
        amount: transaction.amount,
        category_name: transaction.categoryName,
      })),
      timestamp: (transaction.timestamp ?? new Date()).toISOString(),
    },
  });
  if (error) {
    throw new Error(error);
  }
  return { success: true };
}

export async function createTransactions(
  transactions: {
    id?: string;
    title: string;
    transactions: {
      id?: string;
      notes: string;
      accountName: string;
      amount: number;
      categoryName: string;
    }[];
    timestamp: Date;
  }[],
) {
  const accounts = await apiClient.GET("/twopi-api/account");
  if (accounts.error) {
    throw new Error(accounts.error);
  }
  const categories = await apiClient.GET("/twopi-api/category");
  if (categories.error) {
    throw new Error(categories.error);
  }
  const { error } = await apiClient.PUT("/twopi-api/transaction/import", {
    body: transactions.map((transaction) => {
      return {
        id: transaction.id,
        title: transaction.title,
        transaction_items: transaction.transactions.map((transactionItem) => ({
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
        })),
        timestamp: (transaction.timestamp ?? new Date()).toISOString(),
      };
    }),
  });
  if (error) {
    throw new Error(error);
  }
  return { success: true };
}

export async function getTransactions() {
  const { data, error } = await apiClient.GET("/twopi-api/transaction");
  if (error) {
    throw new Error(error);
  }
  return {
    transactions: data,
  };
}

export async function getTransaction(id: string) {
  const { data: transaction, error } = await apiClient.GET(
    "/twopi-api/transaction/{transaction_id}",
    {
      params: {
        path: {
          transaction_id: id,
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
  return transaction;
}

export async function deleteTransactionItem(id: string) {
  const { error } = await apiClient.DELETE(`/twopi-api/transaction/item`, {
    params: {
      query: {
        id,
      },
    },
  });
  if (error) {
    throw new Error(error);
  }
  return { success: true };
}

export async function deleteTransaction(id: string) {
  const { error } = await apiClient.DELETE(`/twopi-api/transaction`, {
    params: {
      query: {
        id,
      },
    },
  });
  if (error) {
    throw new Error(error);
  }
  return { success: true };
}
