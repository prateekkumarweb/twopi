import { useQuery } from "@tanstack/solid-query";
import { createFileRoute, Link } from "@tanstack/solid-router";
import { Plus } from "lucide-solid";
import { For } from "solid-js";
import CurrencyDisplay from "~/components/CurrencyDisplay";
import { PageLayout } from "~/components/PageLayout";
import QueryWrapper from "~/components/QueryWrapper";
import { Badge } from "~/components/ui/badge";
import { buttonVariants } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { type getAccounts } from "~/lib/api/account";
import {
  accountQueryOptions,
  transactionQueryOptions,
} from "~/lib/query-options";

export const Route = createFileRoute("/app/account/")({
  component: RouteComponent,
});

type Account = Awaited<ReturnType<typeof getAccounts>>["accounts"][number];

function RouteComponent() {
  const accountsQuery = useQuery(accountQueryOptions);
  const transactionsQuery = useQuery(transactionQueryOptions);

  const filteredTransactions = () => {
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
  };

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
          <div class="my-2 flex flex-col gap-2">
            {data.accounts?.length === 0 && <div>No accounts found</div>}
            <For each={data.accounts} fallback={<div>No accounts found</div>}>
              {(account, i) => (
                <>
                  <AccountItem
                    account={account}
                    currentBalance={calculateBalance(account)}
                  />
                  {data.accounts?.length !== i() + 1 && <Separator />}
                </>
              )}
            </For>
          </div>
        )}
      </QueryWrapper>
    </PageLayout>
  );
}

function AccountItem(
  props: Readonly<{
    account: Account;
    currentBalance: number;
  }>,
) {
  return (
    <div class="w-full p-2">
      <Link
        to="/app/account/$id"
        params={{ id: props.account.account.id }}
        class="flex grow flex-col gap-2"
      >
        <div class="flex gap-2">
          <div class="flex grow gap-2">
            {props.account.account.name}
            <Badge variant="outline">
              {props.account.account.account_type}
            </Badge>
            <Badge variant="outline">
              {props.account.account.currency_code}
            </Badge>
          </div>
          <div>
            <Badge
              class={
                props.currentBalance < 0
                  ? "bg-red-900"
                  : props.currentBalance > 0
                    ? "bg-green-900"
                    : ""
              }
            >
              <CurrencyDisplay
                value={props.currentBalance}
                currencyCode={props.account.account.currency_code}
                decimalDigits={props.account.currency.decimal_digits}
              />
            </Badge>
          </div>
        </div>
      </Link>
    </div>
  );
}
