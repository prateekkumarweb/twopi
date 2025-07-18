import { defineQuery } from "@pinia/colada";
import { apiClient } from "./openapi";
import { CURRENCY_QUERY_KEYS } from "./query-keys";

export const useCurrencyQuery = defineQuery({
  key: CURRENCY_QUERY_KEYS.root,
  query: async () => {
    const { data, error } = await apiClient.GET("/twopi-api/currency");
    if (data) {
      return { currency: data };
    } else {
      console.error("Currency Query Error", { data, error });
      throw new Error(error ?? "Failed to fetch currency data");
    }
  },
});
