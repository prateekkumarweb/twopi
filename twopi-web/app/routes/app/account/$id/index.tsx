import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import dayjs from "dayjs";
import { ArrowLeft, Edit, Trash } from "lucide-react";
import { accountByIdQueryOptions } from "~/lib/query-options";

export const Route = createFileRoute("/app/account/$id/")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const query = useQuery(accountByIdQueryOptions(params.id));
  if (query.isPending) return "Loading...";
  if (query.error)
    return (
      <div>
        Error occurred:
        <pre>{JSON.stringify(query.error, undefined, 2)}</pre>
      </div>
    );
  const account = query.data;

  return (
    <div className="flex flex-col gap-2">
      <div className="mb-2 flex items-center gap-2">
        <Link to="/app/account">
          <ArrowLeft size={16} />
        </Link>
        <h1 className="grow text-xl font-bold">Account details</h1>
        <Link
          to="/app/account/$id/edit"
          params={{ id: account.id }}
          className="d-btn d-btn-sm d-btn-primary"
        >
          <Edit size={16} />
        </Link>
        <button className="d-btn d-btn-sm d-btn-error">
          <Trash size={16} />
        </button>
      </div>
      <LabelAndValue label="Id" value={account.id} />
      <LabelAndValue label="Name" value={account.name} />
      <LabelAndValue label="Account type" value={account.accountType} />
      <LabelAndValue
        label="Created at"
        value={dayjs(account.createdAt).format("MMM D, YYYY h:mm A")}
      />
      <LabelAndValue label="Currency" value={account.currencyCode} />
      <LabelAndValue
        label="Starting balance"
        value={Intl.NumberFormat("en", {
          style: "currency",
          currency: account.currencyCode,
        }).format(account.startingBalance)}
      />
      <div className="mt-4">
        <h2 className="text-lg font-bold">Transactions</h2>
        <p>TODO</p>
      </div>
    </div>
  );
}

function LabelAndValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-nowrap items-center gap-2">
      <div className="grow font-semibold">{label}</div>
      <div className="overflow-hidden text-ellipsis text-nowrap text-sm text-gray-700">
        {value}
      </div>
    </div>
  );
}
