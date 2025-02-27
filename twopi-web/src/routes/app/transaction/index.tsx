import { useQueries } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import TransactionList from "~/components/TransactionList";
import { Button } from "~/components/ui/button";
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
        <Button asChild variant="outline">
          <Link to="/app/transaction/new">
            <Plus />
          </Link>
        </Button>
      </div>
      <TransactionList transactions={data.transactions ?? []} />
    </div>
  );
}
