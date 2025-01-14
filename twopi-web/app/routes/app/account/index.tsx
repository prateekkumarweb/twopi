import { useQueries } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import dayjs from "dayjs";
import { accountQueryOptions } from "~/lib/query-options";
import { isDefined } from "~/lib/utils";

export const Route = createFileRoute("/app/account/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { isPending, errors, data } = useQueries({
    queries: [accountQueryOptions()],
    combine: (results) => {
      return {
        data: {
          accounts: results[0].data?.accounts,
        },
        isPending: results.some((result) => result.isPending),
        errors: results.map((result) => result.error).filter(isDefined),
      };
    },
  });

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
        <h2 className="my-2 grow text-xl font-bold">Account</h2>
        <Link to="/app/account/new" className="d-btn d-btn-sm d-btn-secondary">
          New
        </Link>
      </div>
      <div className="my-2 flex flex-col gap-4">
        {data.accounts?.map((account) => (
          <div className="d-card bg-base-100 shadow-sm" key={account.id}>
            <div className="d-card-body flex flex-row gap-2">
              <h2 className="d-card-title grow">{account.name}</h2>
              <div className="d-badge d-badge-sm d-badge-info">
                {account.accountType}
              </div>
              <div className="d-badge d-badge-sm d-badge-neutral">
                {account.currency.symbol} {account.startingBalance}
              </div>
              <div className="d-badge d-badge-sm d-badge-ghost">
                {dayjs(account.createdAt).format("MMM D, YYYY h:mm A")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
