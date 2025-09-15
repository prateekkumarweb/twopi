import { defineMutation, defineQuery, useQueryCache } from "@pinia/colada";
import { apiClient } from "./openapi";
import { TRANSACTION_QUERY_KEYS } from "./query-keys";

const queryCache = useQueryCache();

export const useTransactionsQuery = defineQuery({
  key: TRANSACTION_QUERY_KEYS.root,
  query: async () => {
    const { data, error } = await apiClient.GET("/khata-api/transaction");
    if (data) {
      return { transactions: data };
    } else {
      throw new Error(`Transaction Query Error: ${error}`);
    }
  },
});

export const useCreateTransaactionMutation = defineMutation({
  key: TRANSACTION_QUERY_KEYS.root,
  mutation: async (transaction: {
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
  }) => {
    const accounts = await apiClient.GET("/khata-api/account");
    if (accounts.error) {
      throw new Error(accounts.error);
    }
    const categories = await apiClient.GET("/khata-api/category");
    if (categories.error) {
      throw new Error(categories.error);
    }

    const { error } = await apiClient.PUT("/khata-api/transaction", {
      body: {
        id: transaction.id,
        title: transaction.title,
        items: transaction.transactions.map((transaction) => ({
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
  },
  onSettled: (data) => {
    if (data?.success) {
      queryCache.invalidateQueries({ key: TRANSACTION_QUERY_KEYS.root });
    }
  },
});

export const useCreateTransactionsMutation = defineMutation({
  key: TRANSACTION_QUERY_KEYS.root,
  mutation: async (
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
  ) => {
    const accounts = await apiClient.GET("/khata-api/account");
    if (accounts.error) {
      throw new Error(accounts.error);
    }
    const categories = await apiClient.GET("/khata-api/category");
    if (categories.error) {
      throw new Error(categories.error);
    }
    const { error } = await apiClient.PUT("/khata-api/transaction/import", {
      body: transactions.map((transaction) => {
        return {
          id: transaction.id,
          title: transaction.title,
          items: transaction.transactions.map((transactionItem) => ({
            id: transactionItem.id,
            notes: transactionItem.notes,
            account_name: transactionItem.accountName,
            amount: Math.round(
              transactionItem.amount *
                Math.pow(
                  10,
                  accounts?.data?.find((a) => a.account.name === transactionItem.accountName)
                    ?.currency.decimal_digits ?? 0,
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
  },
  onSettled: (data) => {
    if (data?.success) {
      queryCache.invalidateQueries({ key: TRANSACTION_QUERY_KEYS.root });
    }
  },
});

export const useDeleteTransactionMutation = defineMutation({
  key: TRANSACTION_QUERY_KEYS.root,
  mutation: async (id: string) => {
    const { error } = await apiClient.DELETE("/khata-api/transaction", {
      params: {
        query: {
          id,
        },
      },
    });
    if (error) {
      throw new Error(`Failed to delete transaction: ${error}`);
    }
    return { success: true };
  },
  onSettled: (data) => {
    if (data?.success) {
      queryCache.invalidateQueries({ key: TRANSACTION_QUERY_KEYS.root });
    }
  },
});

export const useDeleteTransactionItemMutation = defineMutation({
  key: TRANSACTION_QUERY_KEYS.root,
  mutation: async (id: string) => {
    const { error } = await apiClient.DELETE(`/khata-api/transaction/item`, {
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
  },
  onSettled: (data) => {
    if (data?.success) {
      queryCache.invalidateQueries({ key: TRANSACTION_QUERY_KEYS.root });
    }
  },
});
