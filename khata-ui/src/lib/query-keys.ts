export const USER_QUERY_KEYS = {
  root: ["user"] as const,
};

export const DASHBOARD_QUERY_KEYS = {
  root: ["dashboard"] as const,
};

export const CURRENCY_QUERY_KEYS = {
  root: [...DASHBOARD_QUERY_KEYS.root, "currency"] as const,
  rates: [...DASHBOARD_QUERY_KEYS.root, "currency", "rates"] as const,
};

export const CATEGORY_QUERY_KEYS = {
  root: [...DASHBOARD_QUERY_KEYS.root, "category"] as const,
};

export const ACCOUNT_QUERY_KEYS = {
  root: [...DASHBOARD_QUERY_KEYS.root, "account"] as const,
};

export const TRANSACTION_QUERY_KEYS = {
  root: [...DASHBOARD_QUERY_KEYS.root, "transaction"] as const,
};
