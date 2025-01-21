import { useQueries } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import TransactionRow from "~/components/TransactionRow";
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
        <h1 className="my-2 grow text-xl font-bold">Transaction</h1>
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
          <TransactionRow key={transaction.id} transaction={transaction} />
        ))}
      </div>
    </div>
  );
}
