import { useQueries } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  accountQueryOptions,
  transactionQueryOptions,
} from "~/lib/query-options";
import { createAccounts } from "~/lib/server-fns/account";
import { createTransactions } from "~/lib/server-fns/transaction";
import { isDefined } from "~/lib/utils";

export const Route = createFileRoute("/app/import-export")({
  component: RouteComponent,
});

function RouteComponent() {
  const { isPending, errors, accounts, transactions } = useQueries({
    queries: [accountQueryOptions(), transactionQueryOptions()],
    combine: (results) => {
      return {
        accounts: results[0].data?.accounts,
        transactions: results[1].data?.transactions,
        isPending: results.some((result) => result.isPending),
        errors: results.map((result) => result.error).filter(isDefined),
      };
    },
  });
  const [accountCsv, setAccountCsv] = useState(
    "Account	Account Type	Starting Balance	Currency	Created At",
  );
  const [transactionCsv, setTransactionCsv] = useState(
    "Date	Account	Amount	Currency	Notes	Category",
  );
  const [error, setError] = useState("");
  const router = useRouter();

  async function importAccounts() {
    setError("");
    const [header, ...lines] = accountCsv.trim().split("\n");
    if (!header) {
      setError("Invalid format");
      return;
    }
    const headerNames = header.split("\t");
    const accountIndex = headerNames.indexOf("Account");
    const accountTypeIndex = headerNames.indexOf("Account Type");
    const startingBalanceIndex = headerNames.indexOf("Starting Balance");
    const currencyIndex = headerNames.indexOf("Currency");
    const createdAtIndex = headerNames.indexOf("Created At");
    if (
      accountIndex === -1 ||
      accountTypeIndex === -1 ||
      startingBalanceIndex === -1 ||
      currencyIndex === -1 ||
      createdAtIndex === -1
    ) {
      setError("Invalid format");
      return;
    }
    const data = [];
    for (const line of lines) {
      if (line.trim() === "") continue;
      const values = line.split("\t");
      const name = values[accountIndex];
      const accountType = values[accountTypeIndex];
      const startingBalance = Number(
        values[startingBalanceIndex]?.replaceAll(",", ""),
      );
      const currencyCode = values[currencyIndex];
      const createdAt = values[createdAtIndex]
        ? new Date(values[createdAtIndex])
        : new Date();
      data.push({
        name,
        accountType,
        startingBalance,
        currencyCode,
        createdAt,
      });
    }
    try {
      await createAccounts({ data });
      router.navigate({ to: "/app/account" });
    } catch (e) {
      // @ts-expect-error e is of type any
      setError(e?.message);
      return;
    }
  }

  async function importTransactions() {
    setError("");
    const [header, ...lines] = transactionCsv.trim().split("\n");
    if (!header) {
      setError("Invalid format");
      return;
    }
    const headerNames = header.split("\t");
    const dateIndex = headerNames.indexOf("Date");
    const accountIndex = headerNames.indexOf("Account");
    const amountIndex = headerNames.indexOf("Amount");
    const currencyIndex = headerNames.indexOf("Currency");
    const notesIndex = headerNames.indexOf("Notes");
    const categoryIndex = headerNames.indexOf("Category");
    const items = [];
    for (const line of lines) {
      if (line.trim() === "") continue;
      const values = line.split("\t");
      const date = values[dateIndex] ? new Date(values[dateIndex]) : new Date();
      const account = values[accountIndex];
      const amount = Number(values[amountIndex]?.replaceAll(",", ""));
      const currency = values[currencyIndex];
      const notes = values[notesIndex];
      const category = values[categoryIndex];
      items.push({ date, account, amount, currency, notes, category });
    }
    const itemsByDate = Object.groupBy(items, (d) => d.date.valueOf());
    const data = [];
    for (const key in itemsByDate) {
      const items = itemsByDate[key];
      if (!items || !items.length) continue;
      data.push({
        name: items.find((item) => item.notes)?.notes ?? "",
        transactions: items.map((item) => ({
          amount: item.amount,
          accountName: item.account?.trim(),
          notes: item.notes,
          categoryName: item.category,
        })),
        timestamp: items[0]?.date ? new Date(items[0]?.date) : new Date(),
      });
    }
    try {
      await createTransactions({ data });
      router.navigate({ to: "/app/transaction" });
    } catch (e) {
      // @ts-expect-error e is of type any
      setError(e?.message);
      return;
    }
  }

  if (isPending) return "Loading...";

  if (errors.length)
    return (
      <div>
        Error occurred:
        {errors.map((error, i) => (
          <div key={i}>{error.message}</div>
        ))}
      </div>
    );

  return (
    <div className="flex w-full flex-col gap-4">
      <h1 className="text-xl font-bold">Import/Export</h1>
      {error && <p className="text-red-700">{error}</p>}
      <details>
        <summary>
          <h2 className="inline font-semibold">Import Accounts</h2>
        </summary>
        <textarea
          className="h-64 w-full font-mono"
          value={accountCsv}
          onChange={(e) => setAccountCsv(e.target.value)}
        ></textarea>
        <button className="d-btn d-btn-primary" onClick={importAccounts}>
          Import
        </button>
      </details>
      <details>
        <summary>
          <h2 className="inline font-semibold">Import Transactions</h2>
        </summary>
        <textarea
          className="h-64 w-full font-mono"
          value={transactionCsv}
          onChange={(e) => setTransactionCsv(e.target.value)}
        ></textarea>
        <button className="d-btn d-btn-primary" onClick={importTransactions}>
          Import
        </button>
      </details>
      <details>
        <summary>
          <h2 className="inline font-semibold">Export everything</h2>
        </summary>
        <textarea
          className="mt-4 h-64 w-full font-mono"
          defaultValue={JSON.stringify(
            {
              accounts,
              transactions,
            },
            null,
            2,
          )}
        ></textarea>
      </details>
    </div>
  );
}
