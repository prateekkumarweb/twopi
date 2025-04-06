import { createForm } from "@tanstack/solid-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/solid-query";
import { useNavigate } from "@tanstack/solid-router";
import dayjs from "dayjs";
import { Trash } from "lucide-solid";
import { For } from "solid-js";
import { createTransaction } from "~/lib/api/transaction";
import {
  accountQueryOptions,
  categoryQueryOptions,
  transactionByIdQueryOptions,
  transactionQueryOptions,
} from "~/lib/query-options";
import CurrencyInput from "./CurrencyInput";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectHiddenSelect,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export default function TransactionEditor(
  props: Readonly<{
    edit?: {
      id: string;
      title: string;
      timestamp: Date;
      items: {
        id: string;
        notes: string;
        accountName: string;
        amount: number;
        categoryName?: string;
      }[];
    };
  }>,
) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const accountsQuery = useQuery(accountQueryOptions);
  const categoriesQuery = useQuery(categoryQueryOptions);

  const timestamp = new Date();
  timestamp.setMilliseconds(0);
  timestamp.setSeconds(0);
  const form = createForm(() => ({
    defaultValues: {
      id: props.edit?.id,
      title: props.edit?.title ?? "",
      transactions: props.edit?.items ?? [
        {
          notes: "",
          accountName: "",
          amount: 0,
          categoryName: "",
        },
      ],
      timestamp: props.edit?.timestamp ?? timestamp,
    },
    onSubmit({ value }) {
      mutation.mutate(value);
    },
  }));
  const mutation = useMutation(() => ({
    mutationFn: async (data: {
      id?: string;
      title: string;
      transactions: {
        id?: string;
        notes: string;
        accountName: string;
        amount: number;
        categoryName?: string;
      }[];
      timestamp: Date;
    }) => {
      await createTransaction(data);
      form.reset();
      navigate({
        to: "..",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          transactionQueryOptions().queryKey,
          props.edit?.id
            ? transactionByIdQueryOptions(props.edit.id).queryKey
            : undefined,
        ],
      });
    },
  }));

  return (
    <div class="w-full">
      <form
        class="my-2 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field name="title">
          {(field) => (
            <Input
              type="text"
              placeholder="Name"
              name={field().name}
              value={field().state.value}
              onBlur={field().handleBlur}
              onChange={(e) => field().handleChange(e.target.value)}
            />
          )}
        </form.Field>
        <form.Field name="timestamp">
          {(field) => (
            <Input
              type="datetime-local"
              placeholder="Date/Time"
              name={field().name}
              value={dayjs(field().state.value).format("YYYY-MM-DDTHH:mm")}
              onBlur={field().handleBlur}
              onChange={(e) =>
                field().handleChange(dayjs(e.target.value).toDate())
              }
            />
          )}
        </form.Field>
        <form.Field name="transactions" mode="array">
          {(field) => (
            <div class="m-2 flex flex-col gap-4">
              <h2 class="text-lg">Transactions:</h2>
              <For each={field().state.value}>
                {(_, i) => (
                  <div class="flex gap-2">
                    <div class="flex grow flex-col gap-2">
                      <form.Field name={`transactions[${i()}].notes`}>
                        {(subField) => (
                          <Input
                            type="text"
                            placeholder="Name"
                            name={subField().name}
                            value={subField().state.value}
                            onBlur={subField().handleBlur}
                            onChange={(e) =>
                              subField().handleChange(e.target.value)
                            }
                          />
                        )}
                      </form.Field>
                      <form.Field name={`transactions[${i()}].accountName`}>
                        {(subField) => (
                          <Select
                            options={
                              accountsQuery.data?.accounts.map(
                                (a) => a.account.name,
                              ) ?? []
                            }
                            name={subField().name}
                            value={subField().state.value}
                            onChange={(e) => subField().handleChange(e ?? "")}
                            placeholder="Select account"
                            itemComponent={(props) => (
                              <SelectItem item={props.item}>
                                {props.item.rawValue}
                              </SelectItem>
                            )}
                          >
                            <SelectHiddenSelect />
                            <SelectTrigger>
                              <SelectValue<string>>
                                {(state) => state.selectedOption()}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent />
                          </Select>
                        )}
                      </form.Field>
                      <form.Field name={`transactions[${i()}].amount`}>
                        {(subField) => (
                          <CurrencyInput
                            name={subField().name}
                            value={subField().state.value}
                            placeholder="Amount"
                            onBlur={subField().handleBlur}
                            onChange={subField().handleChange}
                            currencyCode={
                              accountsQuery.data?.accounts.find(
                                (a) =>
                                  a.account.name ===
                                  subField().form.state.values.transactions[i()]
                                    ?.accountName,
                              )?.currency.code ?? ""
                            }
                            decimalDigits={
                              accountsQuery.data?.accounts.find(
                                (a) =>
                                  a.account.name ===
                                  subField().form.state.values.transactions[i()]
                                    ?.accountName,
                              )?.currency.decimal_digits ?? 0
                            }
                          />
                        )}
                      </form.Field>
                      <form.Field name={`transactions[${i()}].categoryName`}>
                        {(subField) => (
                          <Select
                            options={
                              categoriesQuery.data?.categories.map(
                                (c) => c.name,
                              ) ?? []
                            }
                            name={subField().name}
                            value={subField().state.value}
                            onChange={(e) => subField().handleChange(e ?? "")}
                            placeholder="Select category"
                            itemComponent={(props) => (
                              <SelectItem item={props.item}>
                                {props.item.rawValue}
                              </SelectItem>
                            )}
                          >
                            <SelectHiddenSelect />
                            <SelectTrigger>
                              <SelectValue<string>>
                                {(state) => state.selectedOption()}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent />
                          </Select>
                        )}
                      </form.Field>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => field().removeValue(i())}
                    >
                      <Trash />
                    </Button>
                  </div>
                )}
              </For>
              <Button
                type="button"
                variant="secondary"
                class="mt-2"
                onClick={() =>
                  field().pushValue({
                    notes: "",
                    accountName: "",
                    amount: 0,
                    categoryName: "",
                  })
                }
              >
                Add transaction
              </Button>
            </div>
          )}
        </form.Field>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {(val) => (
            <Button type="submit" disabled={!val()[0]}>
              {val()[1] ? "..." : props.edit ? "Update" : "Create"}
            </Button>
          )}
        </form.Subscribe>
        {mutation.isError && (
          <p class="text-destructive">{mutation.error?.message}</p>
        )}
      </form>
    </div>
  );
}
