import { useForm } from "@tanstack/react-form";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import dayjs from "dayjs";
import { AccountType, type AccountTypeOrigin } from "~/lib/hacks/account-type";
import {
  accountByIdQueryOptions,
  accountQueryOptions,
  currencyQueryOptions,
} from "~/lib/query-options";
import { createAccount } from "~/lib/server-fns/account";
import { isDefined } from "~/lib/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export default function AccountEditor(props: {
  edit?: {
    id: string;
    name: string;
    accountType: AccountTypeOrigin;
    createdAt: Date;
    currencyCode: string;
    startingBalance: number;
  };
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isPending, errors, data } = useQueries({
    queries: [currencyQueryOptions()],
    combine: (results) => {
      return {
        data: {
          currencies: results[0].data?.data,
        },
        isPending: results.some((result) => result.isPending),
        errors: results.map((result) => result.error).filter(isDefined),
      };
    },
  });

  const createdAt = new Date();
  createdAt.setMilliseconds(0);
  createdAt.setSeconds(0);
  const form = useForm({
    defaultValues: {
      id: props.edit?.id,
      name: props.edit?.name || "",
      accountType: props.edit?.accountType || "",
      createdAt: props.edit?.createdAt || createdAt,
      currencyCode: props.edit?.currencyCode || "",
      startingBalance: props.edit?.startingBalance || 0,
    },
    onSubmit: ({ value }) => {
      mutation.mutate(value);
    },
  });
  const mutation = useMutation({
    mutationFn: async (data: unknown) => {
      createAccount({ data });
      form.reset();
      navigate({
        to: "..",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          accountQueryOptions().queryKey,
          props.edit?.id
            ? accountByIdQueryOptions(props.edit.id).queryKey
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
        <h1 className="my-2 grow text-xl font-bold">
          {props.edit ? "Edit" : "New"} Account
        </h1>
        <Button asChild variant="outline">
          <Link to="..">Back</Link>
        </Button>
      </div>
      <form
        className="my-2 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field name="name">
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
        <form.Field name="accountType">
          {(field) => (
            <Select
              value={field.state.value}
              onValueChange={(e) => field.handleChange(e)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Account type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(AccountType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </form.Field>
        <form.Field name="createdAt">
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
        <form.Field name="currencyCode">
          {(field) => (
            <Select
              value={field.state.value}
              onValueChange={(e) => field.handleChange(e)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                {data.currencies?.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </form.Field>
        <form.Field name="startingBalance">
          {(field) => (
            <Input
              type="text"
              placeholder="Starting Balance"
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(Number(e.target.value))}
            />
          )}
        </form.Field>
        <Button type="submit" disabled={mutation.isPending}>
          {props.edit ? "Update" : "Create"}
        </Button>
        {mutation.isPending && <p className="text-info-content">Creating...</p>}
        {mutation.isError && (
          <p className="text-destructive">{mutation.error?.message}</p>
        )}
      </form>
    </div>
  );
}
