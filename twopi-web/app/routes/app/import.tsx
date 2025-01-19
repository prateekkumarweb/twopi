import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/app/import")({
  component: RouteComponent,
});

function RouteComponent() {
  const [accountCsv, setAccountCsv] = useState("");
  const [transactionCsv, setTransactionCsv] = useState("");

  function importAccounts() {
    console.log(accountCsv);
  }

  function importTransactions() {
    console.log(transactionCsv);
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <h1 className="text-xl font-bold">Import</h1>
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
