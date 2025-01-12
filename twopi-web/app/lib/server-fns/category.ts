import { createServerFn } from "@tanstack/start";
import { getWebRequest } from "vinxi/http";
import { z } from "zod";
import { auth } from "../server/auth";
import { getDbClient } from "../server/db";

const createCategoryValidator = z.object({
  name: z.string().min(1).max(100),
  group: z.string().optional(),
});

export const createCategory = createServerFn({ method: "POST" })
  .validator((category: unknown) => {
    return createCategoryValidator.parse(category);
  })
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({
      headers: getWebRequest().headers,
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const db = await getDbClient(session?.user);
    const value = await db.category.create({ data });
    return { success: true, value };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .validator((name: unknown) => {
    return z.string().length(3).parse(name);
  })
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({
      headers: getWebRequest().headers,
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const db = await getDbClient(session?.user);
    const value = await db.category.delete({ where: { name: data } });
    return { success: true, value };
  });

export const getCategories = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await auth.api.getSession({
      headers: getWebRequest().headers,
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const db = await getDbClient(session?.user);
    return { categories: await db.category.findMany() };
  },
);
