import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import clsx from "clsx";
import { useState } from "react";
import { getWebRequest } from "vinxi/http";
import { z } from "zod";
import { auth } from "~/lib/server/auth";
import { getDbClient } from "~/lib/server/db";
import { Trash, Save } from "lucide-react";

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

  const deleteMutation = useMutation({
    mutationFn: (code: string) => deleteCurrency({ data: code }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currencyData"] });
    },
  });

  if (isPending) return "Loading...";

  if (isFetching) return "Fetching...";

  if (error) return "An error has occurred: " + error.message;

  const cellClasses = clsx("border border-slate-300 p-2");

  return (
    <div className="w-full">
      <h2 className="my-4 text-xl font-bold">Currency</h2>
      <table className="w-full table-auto border-collapse border border-slate-400">
        <thead>
          <tr>
            <th className={cellClasses}>Code</th>
            <th className={cellClasses}>Name</th>
            <th className={cellClasses}>Base</th>
            <th className={cellClasses}>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={cellClasses}>
              <input
                type="text"
                className="w-full"
                value={createCurrencyForm.code}
                onChange={(e) =>
                  setCreateCurrency({
                    ...createCurrencyForm,
                    code: e.target.value,
                  })
                }
                placeholder="code"
              />
            </td>
            <td className={cellClasses}>
              <input
                type="text"
                className="w-full"
                value={createCurrencyForm.name}
                onChange={(e) =>
                  setCreateCurrency({
                    ...createCurrencyForm,
                    name: e.target.value,
                  })
                }
                placeholder="name"
              />
            </td>
            <td className={cellClasses}>
              <input
                type="number"
                className="w-full"
                value={createCurrencyForm.base}
                onChange={(e) =>
                  setCreateCurrency({
                    ...createCurrencyForm,
                    base: Number(e.target.value),
                  })
                }
                placeholder="base"
              />
            </td>
            <td className={cellClasses}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  mutation.mutate(createCurrencyForm);
                }}
              >
                <Save />
              </button>
            </td>
          </tr>
          {data.currencies
            ? data.currencies.map((currency) => (
                <tr key={currency.code}>
                  <td className={cellClasses}>{currency.code}</td>
                  <td className={cellClasses}>{currency.name}</td>
                  <td className={cellClasses}>{currency.base}</td>
                  <td className={cellClasses}>
                    <button
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
    </div>
  );
}
