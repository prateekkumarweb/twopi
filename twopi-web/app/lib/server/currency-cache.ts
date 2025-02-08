import { apiClient } from "../openapi";

export async function getCurrenciesCache() {
  const { data, error } = await apiClient.GET(
    "/twopi-api/currency-cache/currencies",
  );
  if (error) {
    throw new Error(error);
  }
  return data;
}

export async function getCurrenciesLatestCache() {
  const { data, error } = await apiClient.GET(
    "/twopi-api/currency-cache/latest",
  );
  if (error) {
    throw new Error(error);
  }
  return data;
}
