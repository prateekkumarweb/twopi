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

export const iconMap: Record<AccountTypeOrigin, string> = {
  Cash: "i-lucide-banknote",
  Wallet: "i-lucide-wallet",
  Bank: "i-lucide-landmark",
  CreditCard: "i-lucide-credit-card",
  Loan: "i-lucide-hand-coins",
  Person: "i-lucide-book-user",
} as const;
