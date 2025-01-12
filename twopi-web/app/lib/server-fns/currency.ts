import { createServerFn } from "@tanstack/start";
import { getWebRequest } from "vinxi/http";
import { z } from "zod";
import { auth } from "../server/auth";
import { getDbClient } from "../server/db";

export const createCurrencyValidator = z.object({
  code: z.string().length(3),
  name: z.string().min(1).max(100),
  base: z.number().min(1),
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
    await db.currency.create({ data });
    return { success: true };
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
    await db.currency.delete({ where: { code: data } });
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
    const db = await getDbClient(session?.user);
    return { currencies: await db.currency.findMany() };
  },
);
