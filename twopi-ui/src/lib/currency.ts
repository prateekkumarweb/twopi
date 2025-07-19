import { defineMutation, defineQuery, useQueryCache } from "@pinia/colada";
import { apiClient } from "./openapi";
import { CURRENCY_QUERY_KEYS } from "./query-keys";

const queryCache = useQueryCache();

export const useCurrencyQuery = defineQuery({
  key: CURRENCY_QUERY_KEYS.root,
  query: async () => {
    const { data, error } = await apiClient.GET("/twopi-api/currency");
    if (data) {
      return { currency: data };
    } else {
      return { error: error || "Failed to fetch currency data" };
    }
  },
});

export const useCreateCurrencyMutation = defineMutation({
  mutation: async (currencyData: { code: string; name: string; decimal_digits: number }) => {
    const { error } = await apiClient.POST("/twopi-api/currency", {
      body: currencyData,
    });
    if (error) {
      throw new Error(`Failed to create currency: ${error}`);
    } else {
      return { success: true };
    }
  },
  onSettled: () => {
    queryCache.invalidateQueries({ key: CURRENCY_QUERY_KEYS.root });
  },
});

export const useDeleteCurrencyMutation = defineMutation({
  mutation: async (currencyCode: string) => {
    const { error } = await apiClient.DELETE("/twopi-api/currency", {
      params: {
        query: {
          code: currencyCode,
        },
      },
    });
    if (error) {
      return { success: false, error: error };
    } else {
      return { success: true };
    }
  },
  onSettled: () => {
    queryCache.invalidateQueries({ key: CURRENCY_QUERY_KEYS.root });
  },
});

export const useSyncCurrencyMutation = defineMutation({
  mutation: async () => {
    const { error } = await apiClient.PUT("/twopi-api/currency/sync");
    if (error) {
      return { success: false, error: error };
    } else {
      return { success: true };
    }
  },
  onSettled: () => {
    queryCache.invalidateQueries({ key: CURRENCY_QUERY_KEYS.root });
  },
});
