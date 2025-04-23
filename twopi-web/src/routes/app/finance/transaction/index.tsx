import { useQuery } from "@tanstack/solid-query";
import { createFileRoute, Link } from "@tanstack/solid-router";
import { Plus } from "lucide-solid";
import { PageLayout } from "~/components/PageLayout";
import QueryWrapper from "~/components/QueryWrapper";
import TransactionList from "~/components/TransactionList";
import { buttonVariants } from "~/components/ui/button";
import { transactionQueryOptions } from "~/lib/query-options";

export const Route = createFileRoute("/app/finance/transaction/")({
  component: RouteComponent,
});

function RouteComponent() {
  const transactionQuery = useQuery(transactionQueryOptions);

  return (
    <PageLayout
      title="Transaction"
      actions={
        <Link
          to="/app/finance/transaction/new"
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
        queryResult={transactionQuery}
        errorRender={(e) => <div>{e.message}</div>}
      >
        {(data) => <TransactionList transactions={data?.transactions ?? []} />}
      </QueryWrapper>
    </PageLayout>
  );
}
