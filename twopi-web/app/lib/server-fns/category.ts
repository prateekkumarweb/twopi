import { createServerFn } from "@tanstack/start";
import { v7 as uuidv7 } from "uuid";
import { getWebRequest } from "vinxi/http";
import { z } from "zod";
import { apiClient } from "../openapi";
import { auth } from "../server/auth";

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
    const { error } = await apiClient.POST("/category", {
      params: {
        header: {
          "x-user-id": session.user.id,
        },
      },
      body: {
        name: data.name,
        group: data.group ?? "",
        icon: "",
        id: uuidv7(),
      },
    });
    if (error) {
      throw new Error(error);
    }
    return { success: true };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .validator((id: unknown) => {
    return z.string().parse(id);
  })
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({
      headers: getWebRequest().headers,
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const { error } = await apiClient.DELETE("/category", {
      params: {
        header: { "x-user-id": session.user.id },
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

export const getCategories = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await auth.api.getSession({
      headers: getWebRequest().headers,
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const { data, error } = await apiClient.GET("/category", {
      params: {
        header: {
          "x-user-id": session.user.id,
        },
      },
    });
    if (error) {
      throw new Error(error);
    }
    return { categories: data };
  },
);
