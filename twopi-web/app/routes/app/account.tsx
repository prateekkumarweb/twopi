import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { getWebRequest } from "vinxi/http";
import { z } from "zod";
import { auth } from "~/lib/server/auth";
import { getDbClient } from "~/lib/server/db";

export const Route = createFileRoute("/app/account")({
  component: RouteComponent,
});

const createAccountValidator = z.object({
  name: z.string(),
  accountType: z.enum([
    "savings",
    "current",
    "loan",
    "credit",
    "wallet",
    "person",
  ]),
  currencyCode: z.string(),
  startingBalance: z.number().default(0),
});

const createAccount = createServerFn({ method: "POST" })
  .validator((account: unknown) => createAccountValidator.parse(account))
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({
      headers: getWebRequest().headers,
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const db = await getDbClient(session?.user);
    await db.account.create({ data });
    return { success: true };
  });

const getAccounts = createServerFn({ method: "GET" }).handler(async () => {
  const session = await auth.api.getSession({
    headers: getWebRequest().headers,
  });
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  const db = await getDbClient(session?.user);
  return { accounts: await db.account.findMany() };
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const { isPending, error, data, isFetching } = useQuery({
    queryKey: ["accountData"],
    queryFn: async () => {
      return await getAccounts();
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
    mutationFn: async (data: {
      name: string;
      accountType: string;
      currencyCode: string;
      startingBalance: number;
    }) => {
      await createAccount({ data });
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
        <form.Field
          name="name"
          // eslint-disable-next-line react/no-children-prop
          children={(field) => (
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
        />
        <form.Field
          name="accountType"
          // eslint-disable-next-line react/no-children-prop
          children={(field) => (
            <input
              type="text"
              className="w-full"
              placeholder="Account Type"
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          )}
        />
        <form.Field
          name="currencyCode"
          // eslint-disable-next-line react/no-children-prop
          children={(field) => (
            <input
              type="text"
              className="w-full"
              placeholder="Currency"
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          )}
        />
        <form.Field
          name="startingBalance"
          // eslint-disable-next-line react/no-children-prop
          children={(field) => (
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
        />
        <button type="submit" className="btn btn-primary">
          Create
        </button>
      </form>
      <div className="mt-4 flex flex-col gap-4">
        {data.accounts.map((account) => (
          <div className="card bg-base-100 shadow-sm" key={account.id}>
            <div className="card-body">
              <h2 className="card-title">{account.name}</h2>
              <div className="flex gap-2">
                <div className="badge badge-sm badge-info">
                  {account.accountType}
                </div>
                <div className="badge badge-sm badge-info">
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
