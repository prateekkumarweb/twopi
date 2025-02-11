import { apiClient } from "../openapi";

export async function createCategory(category: {
  name: string;
  group: string;
  icon: string;
}) {
  const { error } = await apiClient.POST("/twopi-api/category", {
    body: category,
  });
  if (error) {
    throw new Error(error);
  }
  return { success: true };
}

export async function deleteCategory(id: string) {
  const { error } = await apiClient.DELETE("/twopi-api/category", {
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

export async function getCategories() {
  const { data, error } = await apiClient.GET("/twopi-api/category");
  if (error) {
    throw new Error(error);
  }
  return { categories: data };
}
