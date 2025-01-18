import { useQueries } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import dayjs from "dayjs";
import { transactionQueryOptions } from "~/lib/query-options";
import { isDefined } from "~/lib/utils";

export const Route = createFileRoute("/app/transaction/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { isPending, errors, data } = useQueries({
    queries: [transactionQueryOptions()],
    combine: (results) => {
      return {
        data: {
          transactions: results[0].data?.transactions,
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
        <h2 className="my-2 grow text-xl font-bold">Transaction</h2>
        <Link
          to="/app/transaction/new"
          className="d-btn d-btn-sm d-btn-secondary"
        >
          New
        </Link>
      </div>
      <div className="my-2 flex flex-col gap-2">
        {data.transactions?.length === 0 && <div>No transactions found</div>}
        {data.transactions?.map((transaction) => (
          <div
            className="bg-base-100 flex flex-col gap-2 p-2 shadow-sm"
            key={transaction.id}
          >
            <div className="flex gap-2">
              <h2 className="grow text-ellipsis text-nowrap">
                {transaction.name}
              </h2>
              <div className="flex gap-2">
                <div className="d-badge d-badge-sm d-badge-ghost text-nowrap">
                  {dayjs(transaction.timestamp).format("MMM D, YYYY h:mm A")}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {transaction.transactions.map((item) => (
                <div key={item.id} className="flex w-full items-center gap-2">
                  <div className="grow text-sm text-gray-500">{item.notes}</div>
                  <div className="d-badge d-badge-sm d-badge-neutral">
                    {Intl.NumberFormat("en", {
                      style: "currency",
                      currency: item.account.currencyCode,
                    }).format(item.amount)}
                  </div>
                  {item.categoryName && (
                    <div className="d-badge d-badge-sm d-badge-info">
                      {item.categoryName}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
