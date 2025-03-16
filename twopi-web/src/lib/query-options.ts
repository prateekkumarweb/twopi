import { queryOptions } from "@tanstack/solid-query";
import { getAccount, getAccounts } from "./api/account";
import { getCategories } from "./api/category";
import { getCurrencies, getCurrencyExchangeRates } from "./api/currency";
import { getTransaction, getTransactions } from "./api/transaction";
import { apiClient } from "./openapi";

export function currencyQueryOptions() {
  return queryOptions({
    queryKey: ["currency"],
    queryFn: async () => {
      return await getCurrencies();
    },
  });
}

export function currencyRatesQueryOptions() {
  return queryOptions({
    queryKey: ["currencyRates"],
    queryFn: async () => {
      return await getCurrencyExchangeRates();
    },
  });
}

export function categoryQueryOptions() {
  return queryOptions({
    queryKey: ["category"],
    queryFn: async () => {
      const categories = (await getCategories()).categories ?? [];
      const groups = Array.from(
        new Set(categories.map((category) => category.group)),
      ).map((group) => ({
        group,
        categories: categories.filter((c) => c.group === group),
      }));
      return { categories, groups };
    },
  });
}

export function accountQueryOptions() {
  return queryOptions({
    queryKey: ["account"],
    queryFn: async () => {
      return await getAccounts();
    },
  });
}

export function accountByIdQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["account", id],
    queryFn: async () => {
      return await getAccount(id);
    },
  });
}

export function transactionQueryOptions() {
  return queryOptions({
    queryKey: ["transaction"],
    queryFn: async () => {
      return await getTransactions();
    },
  });
}

export function transactionByIdQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["account", id],
    queryFn: async () => {
      return await getTransaction(id);
    },
  });
}

export function dashboardQueryOptions() {
  return queryOptions({
    queryKey: ["dashboard", "account", "category", "transaction"],
    queryFn: async () => {
      const dashboard = await apiClient.GET("/twopi-api/dashboard");
      if (dashboard.error) {
        throw new Error(dashboard.error);
      }
      return {
        ...dashboard.data,
      };
    },
  });
}
