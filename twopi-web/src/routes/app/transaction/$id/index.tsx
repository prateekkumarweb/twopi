import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import dayjs from "dayjs";
import { ArrowLeft, Edit, Trash } from "lucide-react";
import { Fragment } from "react";
import CurrencyDisplay from "~/components/CurrencyDisplay";
import LabelAndValue from "~/components/LabelAndValue";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import {
  transactionByIdQueryOptions,
  transactionQueryOptions,
} from "~/lib/query-options";
import { deleteTransaction } from "~/lib/server-fns/transaction";

export const Route = createFileRoute("/app/transaction/$id/")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const queryClient = useQueryClient();
  const query = useQuery(transactionByIdQueryOptions(params.id));
  const navigate = Route.useNavigate();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteTransaction(id);
      navigate({
        to: "..",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: transactionQueryOptions().queryKey,
      });
    },
  });

  function deleteTransactionHandler() {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
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
  const transaction = query.data;

  return (
    <div className="flex flex-col gap-2">
      {mutation.isError && (
        <p className="text-destructive">{mutation.error.message}</p>
      )}
      <div className="mb-2 flex items-center gap-2">
        <Link to="..">
          <ArrowLeft />
        </Link>
        <h1 className="grow text-xl font-bold">Transaction details</h1>
        <Button asChild variant="outline">
          <Link to="/app/transaction/$id/edit" params={{ id: transaction.id }}>
            <Edit />
          </Link>
        </Button>
        <Button
          variant="destructive"
          onClick={deleteTransactionHandler}
          disabled={mutation.isPending}
        >
          <Trash />
        </Button>
      </div>
      <LabelAndValue label="Id" value={transaction.id} />
      <LabelAndValue label="Title" value={transaction.title} />
      <LabelAndValue
        label="Timestamp"
        value={dayjs(transaction.timestamp).format("MMM D, YYYY h:mm A")}
      />
      <div className="mt-2">
        <h2 className="text-lg font-bold">Transaction items</h2>
        <div className="my-2 flex flex-col gap-2">
          {transaction.transaction_items.map((transactionItem, i) => (
            <Fragment key={transactionItem.id}>
              <div>
                <LabelAndValue label="Notes" value={transactionItem.notes} />
                <LabelAndValue
                  label="Account"
                  value={transactionItem.account.name}
                />
                <LabelAndValue
                  label="Amount"
                  value={
                    <Badge>
                      <CurrencyDisplay
                        value={transactionItem.amount}
                        currencyCode={transactionItem.account.currency.code}
                        decimalDigits={
                          transactionItem.account.currency.decimal_digits
                        }
                      />
                    </Badge>
                  }
                />
                {transactionItem.category && (
                  <LabelAndValue
                    label="Category"
                    value={transactionItem.category.name}
                  />
                )}
              </div>
              {transaction.transaction_items.length !== i + 1 && <Separator />}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
