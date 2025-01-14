import { useForm } from "@tanstack/react-form";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import dayjs from "dayjs";
import { Trash } from "lucide-react";
import {
  accountQueryOptions,
  categoryQueryOptions,
  currencyQueryOptions,
  transactionQueryOptions,
} from "~/lib/query-options";
import { createTransaction } from "~/lib/server-fns/transaction";
import { isDefined } from "~/lib/utils";

export const Route = createFileRoute("/app/transaction")({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();

  const { isPending, errors, data } = useQueries({
    queries: [
      categoryQueryOptions(),
      currencyQueryOptions(),
      accountQueryOptions(),
      transactionQueryOptions(),
    ],
    combine: (results) => {
      return {
        data: {
          categories: results[0].data?.categories,
          currencies: results[1].data?.currencies,
          accounts: results[2].data?.accounts,
          transactions: results[3].data?.transactions,
        },
        isPending: results.some((result) => result.isPending),
        errors: results.map((result) => result.error).filter(isDefined),
      };
    },
  });

  const timestamp = new Date();
  timestamp.setMilliseconds(0);
  timestamp.setSeconds(0);
  const form = useForm({
    defaultValues: {
      name: "",
      transactions: [
        {
          notes: "",
          accountId: "",
          amount: 0,
          categoryName: "",
        },
      ],
      timestamp,
    },
    onSubmit({ value }) {
      mutation.mutate(value);
    },
  });
  const mutation = useMutation({
    mutationFn: (data: unknown) =>
      createTransaction({
        data,
      }).then(() => {
        form.reset();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: transactionQueryOptions().queryKey,
      });
    },
  });

  if (isPending) return "Loading...";

  if (errors.length)
    return (
      <div>
        Error occurred:
        {errors.map((error, i) => (
          <div key={i}>{error.message}</div>
        ))}
      </div>
    );

  return (
    <div className="w-full">
      <h2 className="my-4 text-xl font-bold">Transaction</h2>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field name="name">
          {(field) => (
            <input
              type="text"
              className="w-full"
              placeholder="Name"
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          )}
        </form.Field>
        <form.Field name="timestamp">
          {(field) => (
            <input
              type="datetime-local"
              className="w-full"
              placeholder="Date/Time"
              name={field.name}
              value={dayjs(field.state.value).format("YYYY-MM-DDTHH:mm")}
              onBlur={field.handleBlur}
              onChange={(e) =>
                field.handleChange(dayjs(e.target.value).toDate())
              }
            />
          )}
        </form.Field>
        <form.Field name="transactions" mode="array">
          {(field) => (
            <div className="m-2 flex flex-col gap-4">
              <h2 className="text-lg">Transactions:</h2>
              {field.state.value.map((_, i) => (
                <div className="flex gap-2" key={i}>
                  <div className="flex grow flex-col gap-2">
                    <form.Field name={`transactions[${i}].notes`}>
                      {(subField) => (
                        <input
                          type="text"
                          className="w-full"
                          placeholder="Name"
                          name={subField.name}
                          value={subField.state.value}
                          onBlur={subField.handleBlur}
                          onChange={(e) =>
                            subField.handleChange(e.target.value)
                          }
                        />
                      )}
                    </form.Field>
                    <form.Field name={`transactions[${i}].accountId`}>
                      {(subField) => (
                        <select
                          className="select w-full"
                          name={subField.name}
                          value={subField.state.value}
                          onBlur={subField.handleBlur}
                          onChange={(e) =>
                            subField.handleChange(e.target.value)
                          }
                        >
                          <option disabled value="">
                            Select account
                          </option>
                          {data.accounts?.map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.name} - {account.currencyCode}
                            </option>
                          ))}
                        </select>
                      )}
                    </form.Field>
                    <form.Field name={`transactions[${i}].amount`}>
                      {(subField) => (
                        <input
                          type="number"
                          className="w-full"
                          placeholder="Amount"
                          name={subField.name}
                          value={subField.state.value}
                          onBlur={subField.handleBlur}
                          onChange={(e) =>
                            subField.handleChange(Number(e.target.value))
                          }
                        />
                      )}
                    </form.Field>
                    <form.Field name={`transactions[${i}].categoryName`}>
                      {(subField) => (
                        <select
                          className="select w-full"
                          name={subField.name}
                          value={subField.state.value}
                          onBlur={subField.handleBlur}
                          onChange={(e) =>
                            subField.handleChange(e.target.value)
                          }
                        >
                          <option disabled value="">
                            Select category
                          </option>
                          {data.categories?.map((category) => (
                            <option key={category.name} value={category.name}>
                              {category.group} - {category.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </form.Field>
                  </div>
                  <button
                    type="button"
                    className="d-btn d-btn-error"
                    onClick={() => field.removeValue(i)}
                  >
                    <Trash />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="d-btn d-btn-secondary mt-2"
                onClick={() =>
                  field.pushValue({
                    notes: "",
                    accountId: "",
                    amount: 0,
                    categoryName: "",
                  })
                }
              >
                Add transaction
              </button>
            </div>
          )}
        </form.Field>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <button
              type="submit"
              className="d-btn d-btn-primary"
              disabled={!canSubmit}
            >
              {isSubmitting ? "..." : "Add"}
            </button>
          )}
        </form.Subscribe>
      </form>
      <div className="mt-4 flex flex-col gap-4">
        {data.transactions?.map((transaction) => (
          <div className="d-card bg-base-100 shadow-sm" key={transaction.id}>
            <div className="d-card-body">
              <div className="flex gap-2">
                <h2 className="d-card-title grow">{transaction.name}</h2>
                <div className="flex gap-2">
                  <div className="d-badge d-badge-sm d-badge-ghost">
                    {dayjs(transaction.timestamp).format("MMM D, YYYY h:mm A")}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {transaction.transactions.map((item) => (
                  <div key={item.id} className="flex w-full gap-2">
                    <div className="grow">{item.notes}</div>
                    <div className="d-badge d-badge-sm d-badge-neutral">
                      {item.account.currency.symbol} {item.amount}
                    </div>
                    <div className="d-badge d-badge-sm d-badge-info">
                      {item.categoryName}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
