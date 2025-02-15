import { useQueries } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import TransactionEditor from "~/components/TransactionEditor";
import { transactionByIdQueryOptions } from "~/lib/query-options";

export const Route = createFileRoute("/app/transaction/$id/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const { data, isPending, errors } = useQueries({
    queries: [transactionByIdQueryOptions(params.id)],
    combine: (results) => {
      return {
        data: results[0].data,
        isPending: results.some((result) => result.isPending),
        errors: results.map((result) => result.error).filter(Boolean),
      };
    },
  });

  if (isPending) return "Loading...";
  if (errors.length)
    return (
      <div>
        Error occurred:
        {errors.map((error, i) => (
          <div key={i}>{error?.message}</div>
        ))}
      </div>
    );

  if (!data) return "Not found";
  return (
    <TransactionEditor
      edit={{
        id: params.id,
        title: data.title,
        timestamp: new Date(data.timestamp),
        transactionItems: data.transaction_items.map((item) => ({
          id: item.id,
          notes: item.notes,
          accountName: item.account.name,
          amount: item.amount,
          categoryName: item.category?.name,
        })),
      }}
    />
  );
}
