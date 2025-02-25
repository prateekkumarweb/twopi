import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Edit, Trash } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import { Fragment } from "react/jsx-runtime";
import LabelAndValue from "~/components/LabelAndValue";
import TransactionRow from "~/components/TransactionRow";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import {
  categoryQueryOptions,
  transactionQueryOptions,
} from "~/lib/query-options";
import { deleteCategory } from "~/lib/server-fns/category";

export const Route = createFileRoute("/app/category/$id/")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, transactions, isPending, errors } = useQueries({
    queries: [categoryQueryOptions(), transactionQueryOptions()],
    combine: (results) => {
      return {
        data: results[0].data?.categories.find(
          (category) => category.id === params.id,
        ),
        transactions: results[1].data?.transactions?.filter((transaction) =>
          transaction.transaction_items.some(
            (item) => item.category?.id === params.id,
          ),
        ),
        isPending: results.some((result) => result.isPending),
        errors: results.map((result) => result.error).filter(Boolean),
      };
    },
  });

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteCategory(id);
      navigate({
        to: "..",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoryQueryOptions().queryKey,
      });
    },
  });

  function deleteCategoryHandler() {
    if (window.confirm("Are you sure you want to delete this category?")) {
      mutation.mutate(params.id);
    }
  }

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
    <div className="flex flex-col gap-2">
      {mutation.isError && (
        <p className="text-destructive">{mutation.error.message}</p>
      )}
      <div className="mb-2 flex items-center gap-2">
        <Link to="..">
          <ArrowLeft />
        </Link>
        <h1 className="grow text-xl font-bold">Category details</h1>
        <Button asChild variant="outline">
          <Link to="/app/category/$id/edit" params={{ id: data.id }}>
            <Edit />
          </Link>
        </Button>
        <Button
          variant="destructive"
          onClick={deleteCategoryHandler}
          disabled={mutation.isPending}
        >
          <Trash />
        </Button>
      </div>
      <LabelAndValue label="Id" value={data.id} />
      <LabelAndValue label="Name" value={data.name} />
      <LabelAndValue label="Group" value={data.group} />
      <LabelAndValue
        label="Icon"
        value={data.icon && <DynamicIcon name={data.icon as "loader"} />}
      />
      <div className="mt-2">
        <h2 className="text-lg font-bold">Transactions</h2>
        <div className="my-2 flex flex-col gap-2">
          {transactions?.map((transaction, i) => (
            <Fragment key={transaction.id}>
              <TransactionRow transaction={transaction} />
              {transactions.length !== i + 1 && <Separator />}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
