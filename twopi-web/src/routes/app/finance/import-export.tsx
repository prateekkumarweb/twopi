import { useQueries } from "@tanstack/solid-query";
import { createFileRoute, useRouter } from "@tanstack/solid-router";
import { createSignal } from "solid-js";
import { PageLayout } from "~/components/PageLayout";
import { QueriesWrapper } from "~/components/QueryWrapper";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { createAccounts } from "~/lib/api/account";
import { createTransactions } from "~/lib/api/transaction";
import type { AccountTypeOrigin } from "~/lib/hacks/account-type";
import {
  accountQueryOptions,
  transactionQueryOptions,
} from "~/lib/query-options";

export const Route = createFileRoute("/app/finance/import-export")({
  component: RouteComponent,
});

function RouteComponent() {
  const queries = useQueries(() => ({
    queries: [accountQueryOptions(), transactionQueryOptions()],
  }));

  const [accountCsv, setAccountCsv] = createSignal(
    "Account	Account Type	Starting Balance	Currency	Created At",
  );
  const [transactionCsv, setTransactionCsv] = createSignal(
    "Date	Account	Amount	Currency	Transaction	Notes	Category",
  );
  const [error, setError] = createSignal("");
  const router = useRouter();

  async function importAccounts() {
    setError("");
    const [header, ...lines] = accountCsv().trim().split("\n");
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
      const name = values[accountIndex] ?? "";
      const accountType = values[accountTypeIndex] as AccountTypeOrigin;
      const startingBalance = Number(
        values[startingBalanceIndex]?.replaceAll(",", ""),
      );
      const currencyCode = values[currencyIndex] ?? "";
      const createdAt = values[createdAtIndex]
        ? new Date(values[createdAtIndex])
        : new Date();
      data.push({
        name,
        accountType,
        startingBalance,
        currencyCode,
        isCashFlow: isCashFlow(accountType),
        isActive: true,
        createdAt,
      });
    }
    try {
      await createAccounts(data);
      router.navigate({ to: "/app/finance/account" });
    } catch (e) {
      // @ts-expect-error e is of type unknown
      setError(e?.message);
      return;
    }
  }

  async function importTransactions() {
    setError("");
    const [header, ...lines] = transactionCsv().trim().split("\n");
    if (!header) {
      setError("Invalid format");
      return;
    }
    const headerNames = header.split("\t");
    const dateIndex = headerNames.indexOf("Date");
    const accountIndex = headerNames.indexOf("Account");
    const amountIndex = headerNames.indexOf("Amount");
    const currencyIndex = headerNames.indexOf("Currency");
    const transactionIndex = headerNames.indexOf("Transaction");
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
      const title = values[transactionIndex] ?? "";
      const notes = values[notesIndex];
      const category = values[categoryIndex];
      items.push({ date, account, amount, currency, title, notes, category });
    }
    const itemsByDate = Object.groupBy(
      items,
      (d) => d.date.valueOf() + d.title,
    );
    const data = [];
    for (const key in itemsByDate) {
      const items = itemsByDate[key];
      if (!items || !items.length) continue;
      data.push({
        title: items.find((item) => item.title)?.title ?? "",
        transactions: items.map((item) => ({
          amount: item.amount,
          accountName: item.account?.trim() ?? "",
          notes: item.notes ?? "",
          categoryName: item.category ?? "",
        })),
        timestamp: items[0]?.date ? new Date(items[0]?.date) : new Date(),
      });
    }
    try {
      await createTransactions(data);
      router.navigate({ to: "/app/finance/transaction" });
    } catch (e) {
      // @ts-expect-error e is of type any
      setError(e?.message);
      return;
    }
  }

  return (
    <PageLayout title="Import/Export">
      <QueriesWrapper
        errorRender={(e) => <div>{e.message}</div>}
        queryResults={[queries[0], queries[1]]}
      >
        {(data) => (
          <div class="flex flex-col gap-4">
            {error() && <p class="text-red-700">{error()}</p>}
            <Accordion collapsible multiple>
              <AccordionItem value="import-accounts">
                <AccordionTrigger>Import Accounts</AccordionTrigger>
                <AccordionContent>
                  <Textarea
                    class="mb-2 h-64 font-mono"
                    value={accountCsv()}
                    onChange={(e) => setAccountCsv(e.target.value)}
                  />
                  <Button onClick={importAccounts}>Import</Button>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="import-transactions">
                <AccordionTrigger>Import Transactions</AccordionTrigger>
                <AccordionContent>
                  <Textarea
                    class="mb-2 h-64 font-mono"
                    value={transactionCsv()}
                    onChange={(e) => setTransactionCsv(e.target.value)}
                  />
                  <Button onClick={importTransactions}>Import</Button>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="export-all">
                <AccordionTrigger>Export everything</AccordionTrigger>
                <AccordionContent>
                  <Textarea
                    class="mt-4 h-64 font-mono"
                    value={JSON.stringify(
                      {
                        accounts: data[0].accounts,
                        transactions: data[1].transactions,
                      },
                      null,
                      2,
                    )}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </QueriesWrapper>
    </PageLayout>
  );
}

function isCashFlow(accountType: AccountTypeOrigin): boolean {
  return (
    accountType === "Cash" ||
    accountType === "Wallet" ||
    accountType === "Bank" ||
    accountType === "CreditCard"
  );
}
