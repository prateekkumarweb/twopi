import { createServerFn } from "@tanstack/start";
import { getWebRequest } from "vinxi/http";
import { z } from "zod";
import { apiClient } from "../openapi";
import { auth } from "../server/auth";
import {
  getCurrenciesCache,
  getCurrenciesLatestCache,
} from "../server/currency-cache";
import { getDbClient } from "../server/db";

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
    const db = await getDbClient(session?.user);
    const value = await db.currency.create({ data });
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
    const db = await getDbClient(session?.user);
    const value = await db.currency.delete({ where: { code: data } });
    return { success: true, value };
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
      headers: {
        "x-user-id": session.user.id,
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
    const db = await getDbClient(session?.user);
    const currencies = Object.values(await getCurrenciesCache());
    for (const currency of currencies) {
      if (currency.type !== "fiat") {
        continue;
      }
      const currencyObj = {
        name: currency.name,
        code: currency.code,
        decimalDigits: currency.decimal_digits,
      };
      await db.currency.upsert({
        where: { code: currency.code },
        create: currencyObj,
        update: currencyObj,
      });
    }
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
