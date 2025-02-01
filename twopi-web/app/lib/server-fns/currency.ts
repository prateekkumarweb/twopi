import { createServerFn } from "@tanstack/start";
import { getWebRequest } from "vinxi/http";
import { z } from "zod";
import { apiClient } from "../openapi";
import { auth } from "../server/auth";
import { getCurrenciesLatestCache } from "../server/currency-cache";

const createCurrencyValidator = z.object({
  code: z.string().length(3),
  name: z.string().min(1).max(100),
  decimalDigits: z.number().min(1),
});

export const createCurrency = createServerFn({ method: "POST" })
  .validator((currency: unknown) => {
    return createCurrencyValidator.parse(currency);
  })
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({
      headers: getWebRequest().headers,
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const { data: value, error } = await apiClient.PUT("/currency", {
      params: {
        header: {
          "x-user-id": session.user.id,
        },
      },
      body: {
        code: data.code,
        name: data.name,
        decimal_digits: data.decimalDigits,
      },
    });
    if (error) {
      throw new Error(error);
    }
    return { success: true, value };
  });

export const deleteCurrency = createServerFn({ method: "POST" })
  .validator((code: unknown) => {
    return z.string().length(3).parse(code);
  })
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({
      headers: getWebRequest().headers,
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const { error } = await apiClient.DELETE("/currency", {
      params: {
        header: {
          "x-user-id": session.user.id,
        },
        query: {
          code: data,
        },
      },
    });
    if (error) {
      throw new Error(error);
    }
    return { success: true };
  });

export const getCurrencies = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await auth.api.getSession({
      headers: getWebRequest().headers,
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const { data, error } = await apiClient.GET("/currency", {
      params: {
        header: {
          "x-user-id": session.user.id,
        },
      },
    });
    if (error) {
      throw new Error(error);
    }
    return { data };
  },
);

export const syncCurrencies = createServerFn({ method: "POST" }).handler(
  async () => {
    const session = await auth.api.getSession({
      headers: getWebRequest().headers,
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const { error } = await apiClient.POST("/currency/sync", {
      params: {
        header: {
          "x-user-id": session.user.id,
        },
      },
    });
    if (error) {
      throw new Error(error);
    }
    return {};
  },
);

export const getCurrencyExchangeRates = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await auth.api.getSession({
    headers: getWebRequest().headers,
  });
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return await getCurrenciesLatestCache();
});
