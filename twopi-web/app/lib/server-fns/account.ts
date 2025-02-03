import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { v7 as uuidv7 } from "uuid";
import { getWebRequest } from "vinxi/http";
import { z } from "zod";
import { AccountType } from "~/lib/hacks/account-type";
import { apiClient } from "../openapi";
import { auth } from "../server/auth";

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
    const currency = await apiClient.GET("/currency/{code}", {
      params: {
        header: {
          "x-user-id": session.user.id,
        },
        path: {
          code: data.currencyCode,
        },
      },
    });
    if (currency.error) {
      throw new Error(currency.error);
    }
    const { error } = await apiClient.PUT("/account", {
      params: {
        header: {
          "x-user-id": session.user.id,
        },
      },
      body: {
        id: uuidv7(),
        name: data.name,
        account_type: data.accountType,
        currency_code: data.currencyCode,
        starting_balance: Math.round(
          data.startingBalance *
            Math.pow(10, currency.data?.decimal_digits ?? 0),
        ),
        created_at: (data.createdAt ?? new Date())?.toISOString(),
      },
    });
    if (error) {
      throw new Error(error);
    }
    return { success: true };
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
    for (const item of data) {
      const currency = await apiClient.GET("/currency/{code}", {
        params: {
          header: {
            "x-user-id": session.user.id,
          },
          path: {
            code: item.currencyCode,
          },
        },
      });
      item.startingBalance = Math.round(
        item.startingBalance * Math.pow(10, currency.data?.decimal_digits ?? 0),
      );
    }
    const { error } = await apiClient.PUT("/account/import", {
      params: {
        header: {
          "x-user-id": session.user.id,
        },
      },
      body: data.map((item) => ({
        id: uuidv7(),
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
  });

export const getAccounts = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await auth.api.getSession({
      headers: getWebRequest().headers,
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const { data: value, error } = await apiClient.GET("/account", {
      params: {
        header: {
          "x-user-id": session.user.id,
        },
      },
    });
    if (error) {
      throw new Error(error);
    }
    return {
      accounts:
        value?.map((account) => ({
          ...account,
          starting_balance:
            account.starting_balance /
            Math.pow(10, account.currency?.decimal_digits ?? 0),
        })) ?? [],
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
    const { data: account, error } = await apiClient.GET(
      "/account/{account_id}",
      {
        params: {
          header: {
            "x-user-id": session.user.id,
          },
          path: {
            account_id: data,
          },
        },
      },
    );
    if (error) {
      throw new Error(error);
    }
    if (!account) {
      throw notFound({ data: "Account not found" });
    }
    return {
      ...account,
      starting_balance:
        account.starting_balance /
        Math.pow(10, account.currency?.decimal_digits ?? 0),
      transactions: account.transactions?.map((transaction) => ({
        ...transaction,
        transaction_items: transaction.transaction_items?.map((item) => ({
          ...item,
          amount: item.amount / Math.pow(10, account.currency.decimal_digits),
          account: {
            ...item.account,
            starting_balance:
              item.account.starting_balance /
              Math.pow(10, item.account.currency.decimal_digits),
          },
        })),
      })),
    };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .validator((id: unknown) => z.string().parse(id))
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({
      headers: getWebRequest().headers,
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const { error } = await apiClient.DELETE("/account", {
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
