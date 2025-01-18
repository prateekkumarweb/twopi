import { AccountType } from "@prisma/client";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import dayjs from "dayjs";
import { accountQueryOptions, currencyQueryOptions } from "~/lib/query-options";
import { createAccount } from "~/lib/server-fns/account";
import { isDefined } from "~/lib/utils";

export const Route = createFileRoute("/app/account/new")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isPending, errors, data } = useQueries({
    queries: [currencyQueryOptions()],
    combine: (results) => {
      return {
        data: {
          currencies: results[0].data?.currencies,
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
      name: "",
      accountType: "savings",
      createdAt,
      currencyCode: "",
      startingBalance: 0,
    },
    onSubmit: ({ value }) => {
      mutation.mutate(value);
    },
  });
  const mutation = useMutation({
    mutationFn: async (data: unknown) => {
      await createAccount({ data });
      form.reset();
      navigate({
        to: "..",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: accountQueryOptions().queryKey,
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
        <h2 className="my-2 grow text-xl font-bold">New Account</h2>
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
        <form.Field name="accountType">
          {(field) => (
            <select
              className="w-full"
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            >
              <option disabled value="">
                Select account type
              </option>
              {Object.values(AccountType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          )}
        </form.Field>
        <form.Field name="createdAt">
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
        <form.Field name="currencyCode">
          {(field) => (
            <select
              className="select w-full"
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            >
              <option disabled value="">
                Select currency
              </option>
              {data.currencies?.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          )}
        </form.Field>
        <form.Field name="startingBalance">
          {(field) => (
            <input
              type="text"
              className="w-full"
              placeholder="Starting Balance"
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(Number(e.target.value))}
            />
          )}
        </form.Field>
        <button
          type="submit"
          className="d-btn d-btn-primary"
          disabled={mutation.isPending}
        >
          Create
        </button>
        {mutation.isPending && <p className="text-info">Creating...</p>}
        {mutation.isError && (
          <p className="text-error">{mutation.error?.message}</p>
        )}
      </form>
    </div>
  );
}
