import { apiClient } from "../openapi";

export async function createCurrency(currency: {
  code: string;
  name: string;
  decimal_digits: number;
}) {
  const { error } = await apiClient.POST("/twopi-api/currency", {
    body: currency,
  });
  if (error) {
    throw new Error(error);
  }
  return { success: true };
}

export async function deleteCurrency(code: string) {
  const { error } = await apiClient.DELETE("/twopi-api/currency", {
    params: {
      query: {
        code,
      },
    },
  });
  if (error) {
    throw new Error(error);
  }
  return { success: true };
}

export async function getCurrencies() {
  const { data, error } = await apiClient.GET("/twopi-api/currency");
  if (error) {
    throw new Error(error);
  }
  return { data };
}

export async function syncCurrencies() {
  const { error } = await apiClient.PUT("/twopi-api/currency/sync");
  if (error) {
    throw new Error(error);
  }
  return { success: true };
}

export async function getCurrencyExchangeRates() {
  const { data, error } = await apiClient.GET(
    "/twopi-api/currency-cache/latest",
  );
  if (error) {
    throw new Error(error);
  }
  return { data: data?.data };
}
