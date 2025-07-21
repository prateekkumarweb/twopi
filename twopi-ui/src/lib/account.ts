import { defineMutation, defineQuery, useQueryCache } from "@pinia/colada";
import type { AccountTypeOrigin } from "./hacks/account-type";
import { apiClient } from "./openapi";
import { ACCOUNT_QUERY_KEYS } from "./query-keys";

const queryCache = useQueryCache();

export const useAccountsQuery = defineQuery({
  key: ACCOUNT_QUERY_KEYS.root,
  query: async () => {
    const { data, error } = await apiClient.GET("/twopi-api/account");
    if (data) {
      return { accounts: data };
    } else {
      throw new Error(`Account Query Error: ${error}`);
    }
  },
});

export const useCreateAccountMutation = defineMutation({
  key: ACCOUNT_QUERY_KEYS.root,
  mutation: async (account: {
    id?: string;
    name: string;
    accountType: AccountTypeOrigin;
    currencyCode: string;
    startingBalance: number;
    isCashFlow: boolean;
    isActive: boolean;
    createdAt: Date;
  }) => {
    const currency = await apiClient.GET("/twopi-api/currency/{code}", {
      params: {
        path: {
          code: account.currencyCode,
        },
      },
    });
    if (currency.error) {
      throw new Error(currency.error);
    }
    const { error } = await apiClient.PUT("/twopi-api/account", {
      body: {
        id: account.id,
        name: account.name,
        account_type: account.accountType,
        currency_code: account.currencyCode,
        is_cash_flow: account.isCashFlow,
        is_active: account.isActive,
        starting_balance: account.startingBalance,
        created_at: account.createdAt.toISOString(),
      },
    });
    if (error) {
      throw new Error(`Failed to create account: ${error}`);
    }
    return { success: true };
  },
  onSettled: (data) => {
    if (data?.success) {
      queryCache.invalidateQueries({ key: ACCOUNT_QUERY_KEYS.root });
    }
  },
});

export const useCreateAccountsMutation = defineMutation({
  key: ACCOUNT_QUERY_KEYS.root,
  mutation: async (
    accounts: {
      name: string;
      accountType: AccountTypeOrigin;
      currencyCode: string;
      startingBalance: number;
      isCashFlow: boolean;
      isActive: boolean;
      createdAt?: Date;
    }[],
  ) => {
    for (const item of accounts) {
      const currency = await apiClient.GET("/twopi-api/currency/{code}", {
        params: {
          path: {
            code: item.currencyCode,
          },
        },
      });
      if (currency.error) {
        throw new Error(currency.error);
      }
      item.startingBalance = Math.round(
        item.startingBalance * Math.pow(10, currency.data?.decimal_digits ?? 0),
      );
    }
    const { error } = await apiClient.PUT("/twopi-api/account/import", {
      body: accounts.map((item) => ({
        name: item.name,
        account_type: item.accountType,
        currency_code: item.currencyCode,
        starting_balance: item.startingBalance,
        is_cash_flow: item.isCashFlow,
        is_active: item.isActive,
        created_at: (item.createdAt ?? new Date())?.toISOString(),
      })),
    });
    if (error) {
      throw new Error(`Failed to create accounts: ${error}`);
    }
    return { success: true };
  },
  onSettled: (data) => {
    if (data?.success) {
      queryCache.invalidateQueries({ key: ACCOUNT_QUERY_KEYS.root });
    }
  },
});

export const useDeleteAccountMutation = defineMutation({
  key: ACCOUNT_QUERY_KEYS.root,
  mutation: async (accountId: string) => {
    const { error } = await apiClient.DELETE("/twopi-api/account", {
      params: {
        query: {
          id: accountId,
        },
      },
    });
    if (error) {
      throw new Error(`Failed to delete account: ${error}`);
    }
    return { success: true };
  },
  onSettled: (data) => {
    if (data?.success) {
      queryCache.invalidateQueries({ key: ACCOUNT_QUERY_KEYS.root });
    }
  },
});
