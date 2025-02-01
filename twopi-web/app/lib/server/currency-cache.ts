import { apiClient } from "../openapi";

interface CurrenciesResponse {
  [key: string]: {
    symbol: string;
    name: string;
    symbol_native: string;
    decimal_digits: number;
    rounding: number;
    code: string;
    name_plural: string;
    type: string;
    countries: string[];
  };
}

export async function getCurrenciesCache() {
  const { data, error } = await apiClient.GET("/currency-cache/currencies");
  if (error) {
    throw new Error(error);
  }
  return data;
}

export async function getCurrenciesLatestCache() {
  const { data, error } = await apiClient.GET("/currency-cache/latest");
  if (error) {
    throw new Error(error);
  }
  return data;
}
