import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import dayjs from "dayjs";
import { ArrowLeft, Edit, Trash } from "lucide-react";
import CurrencyDisplay from "~/components/CurrencyDisplay";
import LabelAndValue from "~/components/LabelAndValue";
import TransactionList from "~/components/TransactionList";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  accountByIdQueryOptions,
  accountQueryOptions,
} from "~/lib/query-options";
import { deleteAccount } from "~/lib/server-fns/account";

export const Route = createFileRoute("/app/account/$id/")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const queryClient = useQueryClient();
  const query = useQuery(accountByIdQueryOptions(params.id));
  const navigate = Route.useNavigate();
  const mutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteAccount(id);
      navigate({
        to: "..",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: accountQueryOptions().queryKey,
      });
    },
  });

  function deleteAccountHandler() {
    if (window.confirm("Are you sure you want to delete this account?")) {
      mutation.mutate(params.id);
    }
  }

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
      {mutation.isError && (
        <p className="text-destructive">{mutation.error.message}</p>
      )}
      <div className="mb-2 flex items-center gap-2">
        <Link to="..">
          <ArrowLeft />
        </Link>
        <h1 className="grow text-xl font-bold">Account details</h1>
        <Button asChild variant="outline">
          <Link to="/app/account/$id/edit" params={{ id: account.id }}>
            <Edit />
          </Link>
        </Button>
        <Button
          variant="destructive"
          onClick={deleteAccountHandler}
          disabled={mutation.isPending}
        >
          <Trash />
        </Button>
      </div>
      <LabelAndValue label="Id" value={account.id} />
      <LabelAndValue label="Name" value={account.name} />
      <LabelAndValue label="Account type" value={account.account_type} />
      <LabelAndValue
        label="Created at"
        value={dayjs(account.created_at).format("MMM D, YYYY h:mm A")}
      />
      <LabelAndValue label="Currency" value={account.currency.code} />
      <LabelAndValue
        label="Starting balance"
        value={
          <Badge
            className={
              account.starting_balance < 0
                ? "bg-red-900"
                : account.starting_balance > 0
                  ? "bg-green-900"
                  : ""
            }
          >
            <CurrencyDisplay
              value={account.starting_balance}
              currencyCode={account.currency.code}
              decimalDigits={account.currency.decimal_digits}
            />
          </Badge>
        }
      />
      <LabelAndValue
        label="Cash flow"
        value={account.is_cash_flow ? "Yes" : "No"}
      />
      <LabelAndValue label="Active" value={account.is_active ? "Yes" : "No"} />
      <div className="mt-2">
        <h2 className="text-lg font-bold">Transactions</h2>
        <TransactionList transactions={account.transactions ?? []} />
      </div>
    </div>
  );
}
