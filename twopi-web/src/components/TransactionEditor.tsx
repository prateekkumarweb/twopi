import { useForm } from "@tanstack/react-form";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import dayjs from "dayjs";
import { ArrowLeft, Trash } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import {
  accountQueryOptions,
  categoryQueryOptions,
  currencyQueryOptions,
  transactionByIdQueryOptions,
  transactionQueryOptions,
} from "~/lib/query-options";
import { createTransaction } from "~/lib/server-fns/transaction";
import { isDefined } from "~/lib/utils";
import CurrencyInput from "./CurrencyInput";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

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
      id: props.edit?.id,
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
        <Link to="..">
          <ArrowLeft />
        </Link>
        <h1 className="my-2 grow text-xl font-bold">
          {props.edit ? "Edit" : "New"} Transaction
        </h1>
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
            <Input
              type="text"
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
            <Input
              type="datetime-local"
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
                        <Input
                          type="text"
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
                        <Select
                          name={subField.name}
                          value={subField.state.value}
                          onValueChange={(e) => subField.handleChange(e)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {data.accounts?.map((account) => (
                              <SelectItem key={account.id} value={account.name}>
                                {account.name} - {account.currency.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </form.Field>
                    <form.Field name={`transactions[${i}].amount`}>
                      {(subField) => (
                        <CurrencyInput
                          value={subField.state.value}
                          onBlur={subField.handleBlur}
                          onChange={subField.handleChange}
                          currencyCode={
                            data.accounts?.find(
                              (a) =>
                                a.name ===
                                subField.form.state.values.transactions[i]
                                  ?.accountName,
                            )?.currency.code ?? ""
                          }
                          decimalDigits={
                            data.accounts?.find(
                              (a) =>
                                a.name ===
                                subField.form.state.values.transactions[i]
                                  ?.accountName,
                            )?.currency.decimal_digits ?? 0
                          }
                        />
                      )}
                    </form.Field>
                    <form.Field name={`transactions[${i}].categoryName`}>
                      {(subField) => (
                        <Select
                          name={subField.name}
                          value={subField.state.value}
                          onValueChange={(e) => subField.handleChange(e)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {data.categories?.map((category) => (
                              <SelectItem
                                key={category.name}
                                value={category.name}
                              >
                                {category.icon && (
                                  <DynamicIcon
                                    name={category.icon as "loader"}
                                    className="mr-2 inline-block h-4 w-4"
                                  />
                                )}
                                {category.group ? category.group + " - " : ""}
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </form.Field>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => field.removeValue(i)}
                  >
                    <Trash />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                className="mt-2"
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
              </Button>
            </div>
          )}
        </form.Field>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? "..." : props.edit ? "Update" : "Create"}
            </Button>
          )}
        </form.Subscribe>
        {mutation.isError && (
          <p className="text-destructive">{mutation.error?.message}</p>
        )}
      </form>
    </div>
  );
}
