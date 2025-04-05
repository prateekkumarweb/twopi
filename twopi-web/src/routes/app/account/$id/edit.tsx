import { useQuery } from "@tanstack/solid-query";
import { createFileRoute, Link } from "@tanstack/solid-router";
import { ArrowLeft } from "lucide-solid";
import AccountEditor from "~/components/AccountEditor";
import { PageLayout } from "~/components/PageLayout";
import QueryWrapper from "~/components/QueryWrapper";
import { buttonVariants } from "~/components/ui/button";
import { type AccountTypeOrigin } from "~/lib/hacks/account-type";
import { accountByIdQueryOptions } from "~/lib/query-options";

export const Route = createFileRoute("/app/account/$id/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const accountQuery = useQuery(() => accountByIdQueryOptions(params().id));

  return (
    <PageLayout
      title="Edit Account"
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
        queryResult={accountQuery}
        errorRender={(e) => <div>{e.message}</div>}
      >
        {(data) => (
          <AccountEditor
            edit={{
              id: data.account.id,
              name: data.account.name,
              accountType: data.account.account_type as AccountTypeOrigin,
              createdAt: new Date(data.account.created_at),
              currencyCode: data.account.currency_code,
              startingBalance: data.account.starting_balance,
              isCashFlow: data.account.is_cash_flow,
              isActive: data.account.is_active,
            }}
          />
        )}
      </QueryWrapper>
    </PageLayout>
  );
}
