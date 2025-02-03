import { useForm } from "@tanstack/react-form";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
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

export default function TransactionEditor(props: {
  edit?: {
    id: string;
    title: string;
    timestamp: Date;
    transactionItems: {
      id: string;
      notes: string;
      accountName: string;
      amount: number;
      categoryName?: string;
    }[];
  };
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isPending, errors, data } = useQueries({
    queries: [
      categoryQueryOptions(),
      currencyQueryOptions(),
      accountQueryOptions(),
    ],
    combine: (results) => {
      return {
        data: {
          categories: results[0].data?.categories,
          currencies: results[1].data?.data,
          accounts: results[2].data?.accounts,
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
      id: props.edit?.id ?? "",
      title: props.edit?.title ?? "",
      transactions: props.edit?.transactionItems ?? [
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
  });
  const mutation = useMutation({
    mutationFn: async (data: unknown) => {
      await createTransaction({
        data,
      });
      form.reset();
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
      <div className="flex items-center gap-2">
        <h1 className="my-2 grow text-xl font-bold">
          {props.edit ? "Edit" : "New"} Transaction
        </h1>
        <Link to=".." className="d-btn d-btn-sm d-btn-secondary">
          Back
        </Link>
      </div>
      <form
        className="my-2 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field name="title">
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
                    <form.Field name={`transactions[${i}].accountName`}>
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
                            <option key={account.id} value={account.name}>
                              {account.name} - {account.currency.code}
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
                              {category.group ? category.group + " - " : ""}
                              {category.name}
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
                className="d-btn mt-2 d-btn-secondary"
                onClick={() =>
                  field.pushValue({
                    notes: "",
                    accountName: "",
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
              {isSubmitting ? "..." : props.edit ? "Update" : "Create"}
            </button>
          )}
        </form.Subscribe>
        {mutation.isError && (
          <p className="text-error">{mutation.error?.message}</p>
        )}
      </form>
    </div>
  );
}
