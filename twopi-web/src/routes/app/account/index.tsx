import { useQuery } from "@tanstack/solid-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/solid-router";
import { Check, Plus, X } from "lucide-solid";
import { createMemo, For } from "solid-js";
import { AccountTypeIcon } from "~/components/AccountTypeIcon";
import CurrencyDisplay from "~/components/CurrencyDisplay";
import { PageLayout } from "~/components/PageLayout";
import QueryWrapper from "~/components/QueryWrapper";
import { Badge } from "~/components/ui/badge";
import { buttonVariants } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { type getAccounts } from "~/lib/api/account";
import type { AccountTypeOrigin } from "~/lib/hacks/account-type";
import {
  accountQueryOptions,
  transactionQueryOptions,
} from "~/lib/query-options";

export const Route = createFileRoute("/app/account/")({
  component: RouteComponent,
});

type Account = Awaited<ReturnType<typeof getAccounts>>["accounts"][number];

function RouteComponent() {
  const navigate = useNavigate();
  const accountsQuery = useQuery(accountQueryOptions);
  const transactionsQuery = useQuery(transactionQueryOptions);

  const filteredTransactions = createMemo(() => {
    if (!transactionsQuery.data || !accountsQuery.data) {
      return [];
    }
    return transactionsQuery.data.transactions?.filter((transaction) => {
      return (
        transaction.items?.some((item) =>
          accountsQuery.data.accounts.some(
            (account) => account.account.id === item.account_id,
          ),
        ) ?? false
      );
    });
  });

  function calculateBalance(account: Account) {
    return (
      account.account.starting_balance +
      (filteredTransactions()
        ?.map((transaction) => {
          let amount = 0;
          for (const item of transaction.items) {
            if (item.account_id === account.account.id) {
              amount += item.amount;
            }
          }
          return amount;
        })
        .reduce((acc, curr) => acc + curr, 0) ?? 0)
    );
  }

  return (
    <PageLayout
      title="Account"
      actions={
        <Link
          to="/app/account/new"
          class={buttonVariants({
            variant: "outline",
            size: "icon",
          })}
        >
          <Plus />
        </Link>
      }
    >
      <QueryWrapper
        queryResult={accountsQuery}
        errorRender={(e) => <div>{e.message}</div>}
      >
        {(data) => (
          <Table>
            <TableHeader>
              <TableRow class="*:py-2">
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead class="text-right">Starting balance</TableHead>
                <TableHead class="text-right">Cash flow</TableHead>
                <TableHead class="text-right">Active</TableHead>
                <TableHead class="text-right">Created at</TableHead>
                <TableHead class="text-right">Current balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For
                each={data.accounts}
                fallback={<div>No accounts found.</div>}
              >
                {(account) => (
                  <TableRow
                    onClick={() => {
                      navigate({
                        to: "/app/account/$id",
                        params: {
                          id: account.account.id,
                        },
                      });
                    }}
                    class="cursor-pointer *:py-2"
                  >
                    <TableCell>{account.account.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <AccountTypeIcon
                          type={
                            account.account.account_type as AccountTypeOrigin
                          }
                        />
                        {account.account.account_type}
                      </Badge>
                    </TableCell>
                    <TableCell class="text-right">
                      <CurrencyComp
                        value={account.account.starting_balance}
                        currencyCode={account.account.currency_code}
                        decimalDigits={account.currency.decimal_digits}
                      />
                    </TableCell>
                    <TableCell class="text-right">
                      {account.account.is_cash_flow ? (
                        <Check class="inline" />
                      ) : (
                        <X class="inline" />
                      )}
                    </TableCell>
                    <TableCell class="text-right">
                      {account.account.is_active ? (
                        <Check class="inline" />
                      ) : (
                        <X class="inline" />
                      )}
                    </TableCell>
                    <TableCell class="text-right">
                      {Intl.DateTimeFormat("en-IN", {
                        dateStyle: "medium",
                      }).format(new Date(account.account.created_at))}
                    </TableCell>
                    <TableCell class="text-right">
                      <CurrencyComp
                        value={calculateBalance(account)}
                        currencyCode={account.account.currency_code}
                        decimalDigits={account.currency.decimal_digits}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </For>
            </TableBody>
          </Table>
        )}
      </QueryWrapper>
    </PageLayout>
  );
}

function CurrencyComp(
  props: Readonly<{
    value: number;
    currencyCode: string;
    decimalDigits: number;
  }>,
) {
  return (
    <Badge
      class={
        props.value < 0
          ? "border-red-600 bg-red-200 text-red-900"
          : props.value > 0
            ? "border-green-600 bg-green-200 text-green-900"
            : "border-gray-600 bg-gray-200 text-gray-900"
      }
    >
      <CurrencyDisplay
        value={props.value}
        currencyCode={props.currencyCode}
        decimalDigits={props.decimalDigits}
      />
    </Badge>
  );
}
