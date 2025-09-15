import { defineMutation, defineQuery, useQueryCache } from "@pinia/colada";
import { apiClient } from "./openapi";
import { CATEGORY_QUERY_KEYS } from "./query-keys";

const queryCache = useQueryCache();

export const useCategoryQuery = defineQuery({
  key: CATEGORY_QUERY_KEYS.root,
  query: async () => {
    const { data, error } = await apiClient.GET("/khata-api/category");
    if (data) {
      return { categories: data };
    } else {
      throw new Error(`Category Query Error: ${error}`);
    }
  },
});

export const useCreateCategoryMutation = defineMutation({
  key: CATEGORY_QUERY_KEYS.root,
  mutation: async (categoryData: { id?: string; name: string; group: string; icon: string }) => {
    const { error } = await apiClient.POST("/khata-api/category", {
      body: categoryData,
    });
    if (error) {
      throw new Error(`Failed to create category: ${error}`);
    }
    return { success: true };
  },
  onSettled: (data) => {
    if (data?.success) {
      queryCache.invalidateQueries({ key: CATEGORY_QUERY_KEYS.root });
    }
  },
});

export const useDeleteCategoryMutation = defineMutation({
  key: CATEGORY_QUERY_KEYS.root,
  mutation: async (categoryId: string) => {
    const { error } = await apiClient.DELETE("/khata-api/category", {
      params: {
        query: {
          id: categoryId,
        },
      },
    });
    if (error) {
      throw new Error(`Failed to delete category: ${error}`);
    }
    return { success: true };
  },
  onSettled: (data) => {
    if (data?.success) {
      queryCache.invalidateQueries({ key: CATEGORY_QUERY_KEYS.root });
    }
  },
});
