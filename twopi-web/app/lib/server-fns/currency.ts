import { createServerFn } from "@tanstack/start";
import { z } from "zod";
import { apiClient } from "../openapi";
import { getCurrenciesLatestCache } from "../server/currency-cache";
import { authMiddleware } from "../server/utils";

const createCurrencyValidator = z.object({
  code: z.string().length(3),
  name: z.string().min(1).max(100),
  decimalDigits: z.number().min(0),
});

export const createCurrency = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((currency: unknown) => {
    return createCurrencyValidator.parse(currency);
  })
  .handler(async ({ data, context }) => {
    const { error } = await apiClient.POST("/currency", {
      params: {
        header: {
          "x-user-id": context.userId,
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
    return { success: true };
  });

export const deleteCurrency = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((code: unknown) => {
    return z.string().length(3).parse(code);
  })
  .handler(async ({ data, context }) => {
    const { error } = await apiClient.DELETE("/currency", {
      params: {
        header: {
          "x-user-id": context.userId,
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

export const getCurrencies = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { data, error } = await apiClient.GET("/currency", {
      params: {
        header: {
          "x-user-id": context.userId,
        },
      },
    });
    if (error) {
      throw new Error(error);
    }
    return { data: data?.sort((a, b) => a.code.localeCompare(b.code)) };
  });

export const syncCurrencies = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { error } = await apiClient.PUT("/currency/sync", {
      params: {
        header: {
          "x-user-id": context.userId,
        },
      },
    });
    if (error) {
      throw new Error(error);
    }
    return {};
  });

export const getCurrencyExchangeRates = createServerFn({
  method: "GET",
})
  .middleware([authMiddleware])
  .handler(async () => {
    return await getCurrenciesLatestCache();
  });
