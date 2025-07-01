import { useMutation, useQuery, useQueryClient } from "@tanstack/solid-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/solid-router";
import dayjs from "dayjs";
import { LucideArrowLeft, LucideEdit, LucideTrash } from "lucide-solid";
import { For, Show } from "solid-js";
import CurrencyDisplay from "~/components/CurrencyDisplay";
import DynamicIcon from "~/components/DynamicIcon";
import LabelAndValue from "~/components/LabelAndValue";
import { PageLayout } from "~/components/PageLayout";
import QueryWrapper from "~/components/QueryWrapper";
import { Badge } from "~/components/ui/badge";
import { Button, buttonVariants } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { deleteTransaction } from "~/lib/api/transaction";
import {
  accountQueryOptions,
  categoryQueryOptions,
  transactionByIdQueryOptions,
  transactionQueryOptions,
} from "~/lib/query-options";

export const Route = createFileRoute("/app/finance/transaction/$id/")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const transactionQuery = useQuery(() =>
    transactionByIdQueryOptions(params().id),
  );

  const mutation = useMutation(() => ({
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
  }));

  function deleteTransactionHandler() {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      mutation.mutate(params().id);
    }
  }

  const accountsQuery = useQuery(accountQueryOptions);
  const categoriesQuery = useQuery(categoryQueryOptions);
  const account = (id: string) =>
    accountsQuery.data?.accounts.find((account) => account.account.id === id);
  const category = (id?: string | null) =>
    categoriesQuery.data?.categories.find((category) => category.id === id);

  return (
    <PageLayout
      title="Transaction details"
      actions={
        <>
          <Link
            to=".."
            class={buttonVariants({
              variant: "outline",
              size: "icon",
            })}
          >
            <LucideArrowLeft />
          </Link>
          <Link
            to="/app/finance/transaction/$id/edit"
            params={{ id: params().id }}
            class={buttonVariants({
              variant: "outline",
              size: "icon",
            })}
          >
            <LucideEdit />
          </Link>
          <Button
            variant="destructive"
            onClick={deleteTransactionHandler}
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
        queryResult={transactionQuery}
        errorRender={(e) => <div>{e.message}</div>}
      >
        {(data) => (
          <>
            <LabelAndValue label="Id" value={data.transaction.id} />
            <LabelAndValue label="Title" value={data.transaction.title} />
            <LabelAndValue
              label="Timestamp"
              value={dayjs(data.transaction.timestamp).format(
                "MMM D, YYYY h:mm A",
              )}
            />
            <div class="mt-2">
              <h2 class="text-lg font-bold">Transaction items</h2>
              <div class="my-2 flex flex-col gap-2">
                <For each={data.items}>
                  {(transactionItem, i) => (
                    <>
                      <div>
                        <LabelAndValue
                          label="Notes"
                          value={transactionItem.notes}
                        />
                        <LabelAndValue
                          label="Account"
                          value={
                            account(transactionItem.account_id)?.account.name
                          }
                        />
                        <LabelAndValue
                          label="Amount"
                          value={
                            <Show when={account(transactionItem.account_id)}>
                              {(account) => (
                                <Badge
                                  class={
                                    transactionItem.amount < 0
                                      ? "border-red-600 bg-red-200 text-red-900"
                                      : transactionItem.amount > 0
                                        ? "border-green-600 bg-green-200 text-green-900"
                                        : "border-gray-600 bg-gray-200 text-gray-900"
                                  }
                                >
                                  <CurrencyDisplay
                                    value={transactionItem.amount}
                                    currencyCode={account()?.currency.code}
                                    decimalDigits={
                                      account()?.currency.decimal_digits
                                    }
                                  />
                                </Badge>
                              )}
                            </Show>
                          }
                        />
                        <Show when={category(transactionItem.category_id)}>
                          {(category) => (
                            <LabelAndValue
                              label="Category"
                              value={
                                <>
                                  {category().icon && (
                                    <DynamicIcon
                                      name={category().icon as "Loader"}
                                      class="mr-2 inline-block h-4 w-4"
                                    />
                                  )}
                                  {category().name}
                                </>
                              }
                            />
                          )}
                        </Show>
                      </div>
                      {data.items.length !== i() + 1 && <Separator />}
                    </>
                  )}
                </For>
              </div>
            </div>
          </>
        )}
      </QueryWrapper>
    </PageLayout>
  );
}
