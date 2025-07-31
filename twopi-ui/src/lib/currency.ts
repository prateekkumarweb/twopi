import { defineMutation, defineQuery, useQueryCache } from "@pinia/colada";
import { apiClient } from "./openapi";
import { CURRENCY_QUERY_KEYS, DASHBOARD_QUERY_KEYS } from "./query-keys";

const queryCache = useQueryCache();

export const useCurrencyQuery = defineQuery({
  key: CURRENCY_QUERY_KEYS.root,
  query: async () => {
    const { data, error } = await apiClient.GET("/twopi-api/currency");
    if (data) {
      return { currency: data };
    } else {
      throw new Error(`Currency Query Error: ${error}`);
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
    }
    return { success: true };
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
      throw new Error(`Failed to delete currency: ${error}`);
    }
    return { success: true };
  },
  onSettled: () => {
    queryCache.invalidateQueries({ key: CURRENCY_QUERY_KEYS.root });
  },
});

export const useSyncCurrencyMutation = defineMutation({
  mutation: async () => {
    const { error } = await apiClient.PUT("/twopi-api/currency/sync");
    if (error) {
      throw new Error(`Failed to sync currency: ${error}`);
    }
    return { success: true };
  },
  onSettled: () => {
    queryCache.invalidateQueries({ key: CURRENCY_QUERY_KEYS.root });
  },
});

export const useCurrencyRatesQuery = defineQuery({
  key: CURRENCY_QUERY_KEYS.rates,
  query: async () => {
    const { data, error } = await apiClient.GET("/twopi-api/currency-cache/latest");
    if (data) {
      return { rates: data };
    } else {
      throw new Error(`Currency Rates Query Error: ${error}`);
    }
  },
});

export const useDashboardQuery = defineQuery({
  key: DASHBOARD_QUERY_KEYS.root,
  query: async () => {
    const { data, error } = await apiClient.GET("/twopi-api/dashboard");
    if (data) {
      return { dashboard: data };
    } else {
      throw new Error(`Dashboard Query Error: ${error}`);
    }
  },
});
