import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { useState } from "react";
import { getWebRequest } from "vinxi/http";
import { z } from "zod";
import { auth } from "~/lib/server/auth";
import { getDbClient } from "~/lib/server/db";

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
  const [createCurrencyForm, setCreateCurrency] = useState({
    code: "",
    name: "",
    base: 100,
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
        setCreateCurrency({
          code: "",
          name: "",
          base: 100,
        });
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currencyData"] });
    },
  });

  if (isPending) return "Loading...";

  if (isFetching) return "Fetching...";

  if (error) return "An error has occurred: " + error.message;

  return (
    <>
      <div>Currency</div>
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Base</th>
          </tr>
        </thead>
        <tbody>
          {data.currencies
            ? data.currencies.map((currency) => (
                <tr key={currency.code}>
                  <td>{currency.code}</td>
                  <td>{currency.name}</td>
                  <td>{currency.base}</td>
                </tr>
              ))
            : null}
        </tbody>
      </table>
      <div>
        <input
          type="text"
          value={createCurrencyForm.code}
          onChange={(e) =>
            setCreateCurrency({ ...createCurrencyForm, code: e.target.value })
          }
          placeholder="code"
        />
        <input
          type="text"
          value={createCurrencyForm.name}
          onChange={(e) =>
            setCreateCurrency({ ...createCurrencyForm, name: e.target.value })
          }
          placeholder="name"
        />
        <input
          type="number"
          value={createCurrencyForm.base}
          onChange={(e) =>
            setCreateCurrency({
              ...createCurrencyForm,
              base: Number(e.target.value),
            })
          }
          placeholder="base"
        />
        <button
          onClick={() => {
            mutation.mutate(createCurrencyForm);
          }}
        >
          Save
        </button>
      </div>
    </>
  );
}
