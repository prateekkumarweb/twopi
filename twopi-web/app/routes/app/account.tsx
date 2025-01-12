import { AccountType } from "@prisma/client";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { createAccount, getAccounts } from "~/lib/server-fns/account";
import { getCurrencies } from "~/lib/server-fns/currency";

export const Route = createFileRoute("/app/account")({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const { isPending, error, data, isFetching } = useQuery({
    queryKey: ["accountData"],
    queryFn: async () => {
      const accounts = await getAccounts();
      const currencies = await getCurrencies();
      return { accounts: accounts.accounts, currencies: currencies.currencies };
    },
  });
  const form = useForm({
    defaultValues: {
      name: "",
      accountType: "savings",
      currencyCode: "",
      startingBalance: 0,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value);
    },
  });
  const mutation = useMutation({
    mutationFn: async (data: unknown) => {
      await createAccount({ data });
      form.reset();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accountData"] });
    },
  });

  if (isPending) return "Loading...";

  if (isFetching) return "Fetching...";

  if (error) return "An error has occurred: " + error.message;

  return (
    <div className="w-full">
      <h2 className="my-4 text-xl font-bold">Account</h2>
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
              {data.currencies.map((currency) => (
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
      <div className="mt-4 flex flex-col gap-4">
        {data.accounts.map((account) => (
          <div className="d-card bg-base-100 shadow-sm" key={account.id}>
            <div className="d-card-body">
              <h2 className="d-card-title">{account.name}</h2>
              <div className="flex gap-2">
                <div className="d-badge d-badge-sm d-badge-info">
                  {account.accountType}
                </div>
                <div className="d-badge d-badge-sm d-badge-neutral">
                  {account.currencyCode} {account.startingBalance}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
