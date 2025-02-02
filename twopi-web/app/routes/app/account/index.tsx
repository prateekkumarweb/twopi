import { useQueries } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
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
        <Link to="/app/account/new" className="d-btn d-btn-sm d-btn-secondary">
          New
        </Link>
      </div>
      <div className="my-2 flex flex-col gap-2">
        {data.accounts?.length === 0 && <div>No accounts found</div>}
        {data.accounts?.map((account) => (
          <AccountItem
            account={account}
            currentBalance={calculateBalance(account)}
            key={account.id}
          />
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
    <div className="w-full bg-base-100 p-2 shadow-xs">
      <Link
        to="/app/account/$id"
        params={{ id: account.id }}
        className="flex grow flex-col gap-2"
      >
        <div className="flex gap-2">
          <div className="grow">{account.name}</div>
          <div>
            <div className="d-badge d-badge-ghost">
              {Intl.NumberFormat("en", {
                style: "currency",
                currency: account.currency.code,
              }).format(currentBalance)}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="grow">
            <div className="d-badge d-badge-info">{account.account_type}</div>
          </div>
          <div>
            <div className="d-badge d-badge-neutral">
              {account.currency.code}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
