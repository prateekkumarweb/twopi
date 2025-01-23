import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import clsx from "clsx";
import dayjs from "dayjs";
import { ArrowLeft, Edit, Trash } from "lucide-react";
import LabelAndValue from "~/components/LabelAndValue";
import TransactionRow from "~/components/TransactionRow";
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
        <Link to="..">
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
        value={
          <span
            className={clsx(
              "d-badge d-badge-sm text-nowrap",
              account.startingBalance > 0
                ? "d-badge-success"
                : account.startingBalance < 0
                  ? "d-badge-error"
                  : "d-badge-neutral",
            )}
          >
            {Intl.NumberFormat("en", {
              style: "currency",
              currency: account.currencyCode,
            }).format(account.startingBalance)}
          </span>
        }
      />
      <div className="mt-2">
        <h2 className="text-lg font-bold">Transactions</h2>
        <div className="my-2 flex flex-col gap-2">
          {account.TransactionItem.map(({ transaction }) => (
            <TransactionRow key={transaction.id} transaction={transaction} />
          ))}
        </div>
      </div>
    </div>
  );
}
