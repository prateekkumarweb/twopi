import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { createAccounts } from "~/lib/server-fns/account";

export const Route = createFileRoute("/app/import")({
  component: RouteComponent,
});

function RouteComponent() {
  const [accountCsv, setAccountCsv] = useState("");
  const [transactionCsv, setTransactionCsv] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function importAccounts() {
    setError("");
    const [header, ...lines] = accountCsv.split("\n");
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
      const values = line.split("\t");
      const name = values[accountIndex];
      const accountType = values[accountTypeIndex];
      const startingBalance = Number(values[startingBalanceIndex]);
      const currencyCode = values[currencyIndex];
      const createdAt = new Date(values[createdAtIndex]);
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

  function importTransactions() {
    console.log(transactionCsv);
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <h1 className="text-xl font-bold">Import</h1>
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
    </div>
  );
}
