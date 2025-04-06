import { useQuery } from "@tanstack/solid-query";
import { createFileRoute, Link } from "@tanstack/solid-router";
import { ArrowLeft } from "lucide-solid";
import { PageLayout } from "~/components/PageLayout";
import QueryWrapper from "~/components/QueryWrapper";
import TransactionEditor from "~/components/TransactionEditor";
import { buttonVariants } from "~/components/ui/button";
import { transactionByIdQueryOptions } from "~/lib/query-options";

export const Route = createFileRoute("/app/transaction/$id/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const transactionQuery = useQuery(() =>
    transactionByIdQueryOptions(params().id),
  );

  return (
    <PageLayout
      title="Edit Transaction"
      actions={
        <Link
          to=".."
          class={buttonVariants({
            variant: "outline",
            size: "icon",
          })}
        >
          <ArrowLeft />
        </Link>
      }
    >
      <QueryWrapper
        queryResult={transactionQuery}
        errorRender={(e) => <div>{e.message}</div>}
      >
        {(data) => (
          <TransactionEditor
            edit={{
              id: data.transaction.id,
              title: data.transaction.title,
              timestamp: new Date(data.transaction.timestamp),
              items: data.items.map((item) => ({
                id: item.id,
                notes: item.notes,
                account_id: item.account_id,
                amount: item.amount,
                category_id: item.category_id,
              })),
            }}
          />
        )}
      </QueryWrapper>
    </PageLayout>
  );
}
