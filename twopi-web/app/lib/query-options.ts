import { queryOptions } from "@tanstack/react-query";
import { getAccounts } from "./server-fns/account";
import { getCategories } from "./server-fns/category";
import { getCurrencies } from "./server-fns/currency";
import { getTransactions } from "./server-fns/transaction";

export function currencyQueryOptions() {
  return queryOptions({
    queryKey: ["currency"],
    queryFn: async () => {
      return await getCurrencies();
    },
  });
}

export function categoryQueryOptions() {
  return queryOptions({
    queryKey: ["category"],
    queryFn: async () => {
      const categories = (await getCategories()).categories;
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

export function transactionQueryOptions() {
  return queryOptions({
    queryKey: ["transaction"],
    queryFn: async () => {
      return await getTransactions();
    },
  });
}
