import { useQueries } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Fragment } from "react";
import CurrencyDisplay from "~/components/CurrencyDisplay";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import {
  accountQueryOptions,
  transactionQueryOptions,
} from "~/lib/query-options";
import type { getAccounts } from "~/lib/server-fns/account";
import { isDefined } from "~/lib/utils";

export const Route = createFileRoute("/app/account/")({
  component: RouteComponent,
});

type Account = Awaited<ReturnType<typeof getAccounts>>["accounts"][number];

function RouteComponent() {
  const { isPending, errors, data } = useQueries({
    queries: [accountQueryOptions(), transactionQueryOptions()],
    combine: (results) => {
      return {
        data: {
          accounts: results[0].data?.accounts,
          transactions: results[1].data?.transactions,
        },
        isPending: results.some((result) => result.isPending),
        errors: results.map((result) => result.error).filter(isDefined),
      };
    },
  });

  function calculateBalance(account: Account) {
    return (
      account.starting_balance +
      (data.transactions
        ?.map((transaction) => {
          let amount = 0;
          for (const item of transaction.transaction_items) {
            if (item.account.id === account.id) {
              amount += item.amount;
            }
          }
          return amount;
        })
        .reduce((acc, curr) => acc + curr, 0) ?? 0)
    );
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
    <div className="w-full">
      <div className="flex items-center gap-2">
        <h1 className="my-2 grow text-xl font-bold">Account</h1>
        <Button asChild variant="outline">
          <Link to="/app/account/new">
            <Plus />
          </Link>
        </Button>
      </div>
      <div className="my-2 flex flex-col gap-2">
        {data.accounts?.length === 0 && <div>No accounts found</div>}
        {data.accounts?.map((account, i) => (
          <Fragment key={account.id}>
            <AccountItem
              account={account}
              currentBalance={calculateBalance(account)}
            />
            {data.accounts?.length !== i + 1 && <Separator />}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function AccountItem({
  account,
  currentBalance,
}: {
  account: Account;
  currentBalance: number;
}) {
  return (
    <div className="w-full p-2">
      <Link
        to="/app/account/$id"
        params={{ id: account.id }}
        className="flex grow flex-col gap-2"
      >
        <div className="flex gap-2">
          <div className="flex grow gap-2">
            {account.name}
            <Badge variant="outline">{account.account_type}</Badge>
            <Badge variant="outline">{account.currency.code}</Badge>
          </div>
          <div>
            <Badge>
              <CurrencyDisplay
                value={currentBalance}
                currencyCode={account.currency.code}
                decimalDigits={account.currency.decimal_digits}
              />
            </Badge>
          </div>
        </div>
      </Link>
    </div>
  );
}
