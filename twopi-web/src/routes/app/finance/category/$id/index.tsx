import { useMutation, useQuery, useQueryClient } from "@tanstack/solid-query";
import { createFileRoute, Link } from "@tanstack/solid-router";
import { LucideArrowLeft, LucideEdit, LucideTrash } from "lucide-solid";
import { createMemo, Show } from "solid-js";
import DynamicIcon from "~/components/DynamicIcon";
import LabelAndValue from "~/components/LabelAndValue";
import { PageLayout } from "~/components/PageLayout";
import QueryWrapper from "~/components/QueryWrapper";
import TransactionList from "~/components/TransactionList";
import { Button, buttonVariants } from "~/components/glass/Button";
import { deleteCategory } from "~/lib/api/category";
import {
  categoryQueryOptions,
  transactionQueryOptions,
} from "~/lib/query-options";

export const Route = createFileRoute("/app/finance/category/$id/")({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const params = Route.useParams();
  const categoriesQuery = useQuery(categoryQueryOptions);
  const navigate = Route.useNavigate();
  const transactionQuery = useQuery(transactionQueryOptions);
  const filteredTransactions = createMemo(
    () =>
      transactionQuery.data?.transactions?.filter((transaction) =>
        transaction.items?.some((item) => item.category_id === params().id),
      ) ?? [],
  );

  const mutation = useMutation(() => ({
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
  }));

  function deleteCategoryHandler() {
    if (window.confirm("Are you sure you want to delete this category?")) {
      mutation.mutate(params().id);
    }
  }

  return (
    <PageLayout
      title="Category details"
      actions={
        <>
          <Link
            to=".."
            class={buttonVariants({
              variant: "secondary",
              size: "icon",
            })}
          >
            <LucideArrowLeft />
          </Link>
          <Link
            to="/app/finance/category/$id/edit"
            params={{ id: params().id }}
            class={buttonVariants({
              variant: "secondary",
              size: "icon",
            })}
          >
            <LucideEdit />
          </Link>
          <Button
            variant="destructive"
            size="icon"
            onClick={deleteCategoryHandler}
            disabled={mutation.isPending}
          >
            <LucideTrash />
          </Button>
        </>
      }
    >
      {mutation.isError && (
        <p class="text-destructive">{mutation.error.message}</p>
      )}
      <QueryWrapper
        queryResult={categoriesQuery}
        errorRender={(e) => <div>{e.message}</div>}
      >
        {(data) => (
          <Show
            when={data.categories.find((c) => c.id === params().id)}
            fallback={"Category not found!"}
          >
            {(data) => (
              <>
                <LabelAndValue label="Id" value={data().id} />
                <LabelAndValue label="Name" value={data().name} />
                <LabelAndValue label="Group" value={data().group} />
                <LabelAndValue
                  label="Icon"
                  value={
                    data().icon && (
                      <DynamicIcon name={data().icon as "Loader"} />
                    )
                  }
                />
                <div class="mt-2">
                  <h2 class="text-lg font-bold">Transactions</h2>
                  <TransactionList
                    transactions={filteredTransactions() ?? []}
                  />
                </div>
              </>
            )}
          </Show>
        )}
      </QueryWrapper>
    </PageLayout>
  );
}
