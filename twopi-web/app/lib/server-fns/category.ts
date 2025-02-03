import { createServerFn } from "@tanstack/start";
import { z } from "zod";
import { apiClient } from "../openapi";
import { authMiddleware } from "../server/utils";

const createCategoryValidator = z.object({
  name: z.string().min(1).max(100),
  group: z.string().optional(),
});

export const createCategory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((category: unknown) => {
    return createCategoryValidator.parse(category);
  })
  .handler(async ({ data, context }) => {
    const { error } = await apiClient.POST("/category", {
      params: {
        header: {
          "x-user-id": context.userId,
        },
      },
      body: {
        name: data.name,
        group: data.group ?? "",
        icon: "",
      },
    });
    if (error) {
      throw new Error(error);
    }
    return { success: true };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => {
    return z.string().parse(id);
  })
  .handler(async ({ data, context }) => {
    const { error } = await apiClient.DELETE("/category", {
      params: {
        header: {
          "x-user-id": context.userId,
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

export const getCategories = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { data, error } = await apiClient.GET("/category", {
      params: {
        header: {
          "x-user-id": context.userId,
        },
      },
    });
    if (error) {
      throw new Error(error);
    }
    return { categories: data };
  });
