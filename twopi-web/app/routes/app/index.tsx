import { createFileRoute, useRouter } from "@tanstack/react-router";
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
  loader: async () => {
    const currencies = await getCurrencies();
    return currencies;
  },
});

function RouteComponent() {
  const router = useRouter();
  const state = Route.useLoaderData();
  const [createCurrencyForm, setCreateCurrency] = useState({
    code: "",
    name: "",
    base: 100,
  });

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
          {state.currencies
            ? state.currencies.map((currency) => (
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
            createCurrency({ data: createCurrencyForm }).then(() => {
              setCreateCurrency({
                code: "",
                name: "",
                base: 100,
              });
              router.invalidate();
            });
          }}
        >
          Save
        </button>
      </div>
    </>
  );
}
