import { useQuery } from "@tanstack/solid-query";
import { createFileRoute, Link } from "@tanstack/solid-router";
import { ArrowLeft } from "lucide-solid";
import { PageLayout } from "~/components/PageLayout";
import QueryWrapper from "~/components/QueryWrapper";
import TransactionEditor from "~/components/TransactionEditor";
import { buttonVariants } from "~/components/ui/button";
import {
  accountQueryOptions,
  categoryQueryOptions,
  transactionByIdQueryOptions,
} from "~/lib/query-options";

export const Route = createFileRoute("/app/transaction/$id/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const transactionQuery = useQuery(() =>
    transactionByIdQueryOptions(params().id),
  );
  const accountsQuery = useQuery(accountQueryOptions);
  const categoriesQuery = useQuery(categoryQueryOptions);
  const account = (id: string) =>
    accountsQuery.data?.accounts.find((account) => account.account.id === id);
  const category = (id?: string | null) =>
    categoriesQuery.data?.categories.find((category) => category.id === id);

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
                accountName: account(item.account_id)?.account.name ?? "",
                amount: item.amount,
                categoryName: category(item.category_id)?.name,
              })),
            }}
          />
        )}
      </QueryWrapper>
    </PageLayout>
  );
}
