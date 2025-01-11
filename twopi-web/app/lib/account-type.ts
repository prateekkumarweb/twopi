export const accountTypes = [
  {
    id: "cash",
    name: "Cash",
  },
  {
    id: "savings",
    name: "Savings",
  },
  {
    id: "checking",
    name: "Checking",
  },
  {
    id: "wallet",
    name: "Wallet",
  },
  {
    id: "person",
    name: "Person",
  },
  {
    id: "credit_card",
    name: "Credit Card",
  },
  {
    id: "loan",
    name: "Loan",
  },
] as const;

export const accountTypeIds = [
  "cash",
  "savings",
  "checking",
  "wallet",
  "person",
  "credit_card",
  "loan",
] as const;

console.assert(
  accountTypes.length === accountTypeIds.length &&
    accountTypes.every((type, index) => accountTypeIds[index] === type.id),
  "Account types are incompatible",
);

export function getAccountType(id: string) {
  return accountTypes.find((type) => type.id === id);
}

export type AccountType = (typeof accountTypes)[number];
