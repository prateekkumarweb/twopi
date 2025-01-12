import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Trash } from "lucide-react";
import { getAccounts } from "~/lib/server-fns/account";
import { getCategories } from "~/lib/server-fns/category";
import { getCurrencies } from "~/lib/server-fns/currency";
import {
  createTransaction,
  getTransactions,
} from "~/lib/server-fns/transaction";

export const Route = createFileRoute("/app/transaction")({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const { isPending, error, data, isFetching } = useQuery({
    queryKey: ["transactionData"],
    queryFn: async () => {
      const { transactions } = await getTransactions();
      const { categories } = await getCategories();
      const { accounts } = await getAccounts();
      const { currencies } = await getCurrencies();
      return { transactions, categories, accounts, currencies };
    },
  });
  const form = useForm({
    defaultValues: {
      name: "",
      categoryName: "",
      transactions: [
        {
          name: "",
          accountId: "",
          amount: 0,
          currencyCode: "",
          currencyAmount: 0,
        },
      ],
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
      queryClient.invalidateQueries({ queryKey: ["transactionData"] });
    },
  });

  if (isPending) return "Loading...";

  if (isFetching) return "Fetching...";

  if (error) return "An error has occurred: " + error.message;

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
        <form.Field name="categoryName">
          {(field) => (
            <select
              className="select w-full"
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            >
              <option disabled value="">
                Select category
              </option>
              {data.categories.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.group} - {category.name}
                </option>
              ))}
            </select>
          )}
        </form.Field>
        <form.Field name="transactions" mode="array">
          {(field) => (
            <div className="m-2 flex flex-col gap-4">
              <h2 className="text-lg">Transactions:</h2>
              {field.state.value.map((_, i) => (
                <div className="flex gap-2" key={i}>
                  <div className="flex grow flex-col gap-2">
                    <form.Field name={`transactions[${i}].name`}>
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
                          {data.accounts.map((account) => (
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
                    <form.Field name={`transactions[${i}].currencyCode`}>
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
                            Select currency
                          </option>
                          {data.currencies.map((currency) => (
                            <option key={currency.code} value={currency.code}>
                              {currency.code} - {currency.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </form.Field>
                    <form.Field name={`transactions[${i}].currencyAmount`}>
                      {(subField) => (
                        <input
                          type="number"
                          className="w-full"
                          placeholder="Currency amount"
                          name={subField.name}
                          value={subField.state.value}
                          onBlur={subField.handleBlur}
                          onChange={(e) =>
                            subField.handleChange(Number(e.target.value))
                          }
                        />
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
                    name: "",
                    accountId: "",
                    amount: 0,
                    currencyCode: "",
                    currencyAmount: 0,
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
        {data.transactions.map((transaction) => (
          <div className="d-card bg-base-100 shadow-sm" key={transaction.id}>
            <div className="d-card-body">
              <h2 className="d-card-title">{transaction.name}</h2>
              <div className="flex gap-2">
                <div className="d-badge d-badge-sm d-badge-info">
                  {transaction.categoryName}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {transaction.transactions.map((item) => (
                  <div key={item.id} className="flex w-full p-4 shadow-sm">
                    <div className="grow">{item.name}</div>
                    <div className="d-badge d-badge-sm d-badge-neutral">
                      {item.account.currencyCode} {item.amount}
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
