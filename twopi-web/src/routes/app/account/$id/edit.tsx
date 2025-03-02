import { useQueries } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import AccountEditor from "~/components/AccountEditor";
import { accountByIdQueryOptions } from "~/lib/query-options";

export const Route = createFileRoute("/app/account/$id/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const { data, isPending, errors } = useQueries({
    queries: [accountByIdQueryOptions(params.id)],
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
    <AccountEditor
      edit={{
        id: data.id,
        name: data.name,
        accountType: data.account_type,
        createdAt: new Date(data.created_at),
        currencyCode: data.currency.code,
        startingBalance: data.starting_balance,
        isCashFlow: data.is_cash_flow,
        isActive: data.is_active,
      }}
    />
  );
}
