import { queryOptions } from "@tanstack/react-query";
import { getAccount, getAccounts } from "./server-fns/account";
import { getCategories } from "./server-fns/category";
import { getCurrencies, getCurrencyExchangeRates } from "./server-fns/currency";
import { getTransaction, getTransactions } from "./server-fns/transaction";

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
      return await getAccount({ data: id });
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
      return await getTransaction({ data: id });
    },
  });
}
