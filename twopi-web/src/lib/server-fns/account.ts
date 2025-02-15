import { notFound } from "@tanstack/react-router";
import { type AccountTypeOrigin } from "~/lib/hacks/account-type";
import { apiClient } from "../openapi";

export async function createAccount(account: {
  id?: string;
  name: string;
  accountType: AccountTypeOrigin;
  currencyCode: string;
  startingBalance: number;
  createdAt: Date;
}) {
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
      starting_balance: account.startingBalance,
      created_at: account.createdAt.toISOString(),
    },
  });
  if (error) {
    throw new Error(error);
  }
  return { success: true };
}

export async function createAccounts(
  accounts: {
    name: string;
    accountType: AccountTypeOrigin;
    currencyCode: string;
    startingBalance: number;
    createdAt?: Date;
  }[],
) {
  for (const item of accounts) {
    const currency = await apiClient.GET("/twopi-api/currency/{code}", {
      params: {
        path: {
          code: item.currencyCode,
        },
      },
    });
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
      created_at: (item.createdAt ?? new Date())?.toISOString(),
    })),
  });
  if (error) {
    throw new Error(error);
  }
  return { success: true };
}

export async function getAccounts() {
  const { data, error } = await apiClient.GET("/twopi-api/account");
  if (error) {
    throw new Error(error);
  }
  return {
    accounts: data ?? [],
  };
}

export async function getAccount(id: string) {
  const { data, error } = await apiClient.GET(
    "/twopi-api/account/{account_id}",
    {
      params: {
        path: {
          account_id: id,
        },
      },
    },
  );
  if (error) {
    throw new Error(error);
  }
  if (!data) {
    throw notFound({ data: "Account not found" });
  }
  return data;
}

export async function deleteAccount(id: string) {
  const { error } = await apiClient.DELETE("/twopi-api/account", {
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
