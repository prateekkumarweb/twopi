import { useQuery, useQueryClient } from "@tanstack/solid-query";
import { createFileRoute } from "@tanstack/solid-router";
import { Trash } from "lucide-solid";
import { For, Match, Switch } from "solid-js";
import { PageLayout } from "~/components/PageLayout";
import { Button } from "~/components/ui/button";
import { deleteCurrency, syncCurrencies } from "~/lib/api/currency";
import { currencyQueryOptions } from "~/lib/query-options";

export const Route = createFileRoute("/app/currency")({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const currenciesQuery = useQuery(currencyQueryOptions);

  const syncAction = async () => {
    await syncCurrencies();
    await queryClient.invalidateQueries(currencyQueryOptions());
  };

  const deleteAction = async (code: string) => {
    await deleteCurrency(code);
    await queryClient.invalidateQueries(currencyQueryOptions());
  };

  return (
    <PageLayout
      title="Currency"
      actions={<Button onClick={syncAction}>Sync</Button>}
    >
      <Switch>
        <Match when={currenciesQuery.isLoading}>
          <div>Loading...</div>
        </Match>
        <Match when={currenciesQuery.isError}>
          <div>Error: {currenciesQuery.error?.message}</div>
        </Match>
        <Match when={currenciesQuery.isSuccess}>
          <table class="w-full table-auto border-collapse border border-slate-400">
            <thead>
              <tr>
                <th class="border border-slate-300 px-2 py-1">Name</th>
                <th class="border border-slate-300 px-2 py-1">Code</th>
                <th class="border border-slate-300 px-2 py-1">
                  Decimal Digits
                </th>
                <th class="border border-slate-300 px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              <For
                each={currenciesQuery.data?.data}
                fallback={
                  <tr>
                    <td colSpan={3}>No currencies</td>
                  </tr>
                }
              >
                {(currency) => (
                  <tr>
                    <td class="border border-slate-300 px-2 py-1">
                      {currency.name}
                    </td>
                    <td class="border border-slate-300 px-2 py-1">
                      {currency.code}
                    </td>
                    <td class="border border-slate-300 px-2 py-1">
                      {currency.decimal_digits}
                    </td>
                    <td class="border border-slate-300 px-2 py-1">
                      <Button
                        variant="destructive"
                        onClick={() => deleteAction(currency.code)}
                      >
                        <Trash />
                      </Button>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </Match>
      </Switch>
    </PageLayout>
  );
}
