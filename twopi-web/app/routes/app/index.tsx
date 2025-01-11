import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { getWebRequest } from "vinxi/http";
import { z } from "zod";
import { auth } from "~/lib/server/auth";
import { getDbClient } from "~/lib/server/db";
import { Trash, Save } from "lucide-react";
import { useForm } from "@tanstack/react-form";

const createCurrencyValidator = z.object({
  code: z.string().length(3),
  name: z.string().min(1).max(100),
  base: z.number().min(1),
});

const createCurrency = createServerFn({ method: "POST" })
  .validator((currency: unknown) => {
    return createCurrencyValidator.parse(currency);
  })
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({
      headers: getWebRequest().headers,
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const db = await getDbClient(session?.user);
    await db.currency.create({ data });
    return { success: true };
  });

const deleteCurrency = createServerFn({ method: "POST" })
  .validator((code: unknown) => {
    return z.string().length(3).parse(code);
  })
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({
      headers: getWebRequest().headers,
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const db = await getDbClient(session?.user);
    await db.currency.delete({ where: { code: data } });
    return { success: true };
  });

const getCurrencies = createServerFn({ method: "GET" }).handler(async () => {
  const session = await auth.api.getSession({
    headers: getWebRequest().headers,
  });
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  const db = await getDbClient(session?.user);
  return { currencies: await db.currency.findMany() };
});

export const Route = createFileRoute("/app/")({
  component: RouteComponent,
});

function RouteComponent() {
  const form = useForm({
    defaultValues: {
      code: "",
      name: "",
      base: 100,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value);
    },
  });
  const queryClient = useQueryClient();
  const { isPending, error, data, isFetching } = useQuery({
    queryKey: ["currencyData"],
    queryFn: async () => {
      return await getCurrencies();
    },
  });
  const mutation = useMutation({
    mutationFn: (data: { code: string; name: string; base: number }) =>
      createCurrency({ data }).then(() => {
        form.reset();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currencyData"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (code: string) => deleteCurrency({ data: code }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currencyData"] });
    },
  });

  if (isPending) return "Loading...";

  if (isFetching) return "Fetching...";

  if (error) return "An error has occurred: " + error.message;

  return (
    <div className="w-full">
      <h2 className="my-4 text-xl font-bold">Currency</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <table className="table w-full">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Base</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <form.Field
                  name="code"
                  // eslint-disable-next-line react/no-children-prop
                  children={(field) => (
                    <input
                      type="text"
                      className="w-full"
                      placeholder="Code"
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  )}
                />
              </td>
              <td>
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
              </td>
              <td>
                <form.Field
                  name="base"
                  // eslint-disable-next-line react/no-children-prop
                  children={(field) => (
                    <input
                      type="number"
                      className="w-full"
                      placeholder="Base"
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(Number(e.target.value))
                      }
                    />
                  )}
                />
              </td>
              <td>
                <button type="submit" className="btn btn-primary">
                  <Save />
                </button>
              </td>
            </tr>
            {data.currencies
              ? data.currencies.map((currency) => (
                  <tr key={currency.code}>
                    <td>{currency.code}</td>
                    <td>{currency.name}</td>
                    <td>{currency.base}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-error"
                        onClick={() => {
                          deleteMutation.mutate(currency.code);
                        }}
                      >
                        <Trash />
                      </button>
                    </td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </form>
    </div>
  );
}
