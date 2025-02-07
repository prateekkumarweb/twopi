import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import clsx from "clsx";
import dayjs from "dayjs";
import { ArrowLeft, Edit, Trash } from "lucide-react";
import LabelAndValue from "~/components/LabelAndValue";
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
    mutationFn: async (data: unknown) => {
      await deleteTransaction({ data });
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
        <p className="text-error-content">{mutation.error.message}</p>
      )}
      <div className="mb-2 flex items-center gap-2">
        <Link to="..">
          <ArrowLeft size={16} />
        </Link>
        <h1 className="grow text-xl font-bold">Transaction details</h1>
        <Link
          to="/app/transaction/$id/edit"
          params={{ id: transaction.id }}
          className="d-btn d-btn-sm d-btn-primary"
        >
          <Edit size={16} />
        </Link>
        <button
          className="d-btn d-btn-sm d-btn-error"
          onClick={deleteTransactionHandler}
          disabled={mutation.isPending}
        >
          <Trash size={16} />
        </button>
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
          {transaction.transaction_items.map((transactionItem) => (
            <div className="bg-base-100 shadow-xs p-2" key={transactionItem.id}>
              <LabelAndValue label="Notes" value={transactionItem.notes} />
              <LabelAndValue
                label="Account"
                value={transactionItem.account.name}
              />
              <LabelAndValue
                label="Amount"
                value={
                  <span
                    className={clsx(
                      "d-badge d-badge-sm text-nowrap",
                      transactionItem.amount > 0
                        ? "d-badge-success"
                        : transactionItem.amount < 0
                          ? "d-badge-error"
                          : "d-badge-neutral",
                    )}
                  >
                    {Intl.NumberFormat("en", {
                      style: "currency",
                      currency: transactionItem.account.currency.code,
                    }).format(transactionItem.amount)}
                  </span>
                }
              />
              {transactionItem.category && (
                <LabelAndValue
                  label="Category"
                  value={transactionItem.category.name}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
