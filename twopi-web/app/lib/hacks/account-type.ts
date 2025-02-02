import type { components } from "../openapi.gen";

// HACK: Since enums are not supported in vite, this is needed
export const AccountType: { [k in AccountTypeOrigin]: k } = {
  Cash: "Cash",
  Wallet: "Wallet",
  Bank: "Bank",
  CreditCard: "CreditCard",
  Loan: "Loan",
  Person: "Person",
} as const;

export type AccountTypeOrigin = components["schemas"]["AccountType"];
