import { createForm } from "@tanstack/solid-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/solid-query";
import { createFileRoute } from "@tanstack/solid-router";
import {
  createSolidTable,
  flexRender,
  getCoreRowModel,
} from "@tanstack/solid-table";
import { Save, Trash } from "lucide-solid";
import { For, Match, Switch } from "solid-js";
import { PageLayout } from "~/components/PageLayout";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  createCurrency,
  deleteCurrency,
  syncCurrencies,
} from "~/lib/api/currency";
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

  const createMutation = useMutation(() => ({
    mutationFn: (data: {
      code: string;
      name: string;
      decimal_digits: number;
    }) =>
      createCurrency(data).then(() => {
        form.reset();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: currencyQueryOptions().queryKey,
      });
    },
  }));

  const deleteMutation = useMutation(() => ({
    mutationFn: async (code: string) => await deleteCurrency(code),
    onSuccess: async () => {
      await queryClient.invalidateQueries(currencyQueryOptions());
    },
  }));

  const form = createForm(() => ({
    defaultValues: {
      code: "",
      name: "",
      decimal_digits: 0,
    },
    onSubmit({ value }) {
      createMutation.mutate(value);
    },
  }));

  type Currency = {
    code: string;
    name: string;
    decimal_digits: number;
  };

  const table = createSolidTable<Currency>({
    columns: [
      {
        accessorKey: "code",
        header: "Code",
      },
      {
        accessorKey: "name",
        header: "Name",
      },
      {
        accessorKey: "decimal_digits",
        header: "Decimal Digits",
      },
      {
        header: "Actions",
        accessorKey: "code",
        cell: (props) => (
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              deleteMutation.mutate(props.getValue());
            }}
          >
            <Trash />
          </Button>
        ),
      },
    ],
    get data() {
      return currenciesQuery.data?.data ?? [];
    },
    getCoreRowModel: getCoreRowModel(),
  });

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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <Table>
              <TableHeader>
                <For each={table.getHeaderGroups()}>
                  {(headerGroup) => (
                    <TableRow>
                      <For each={headerGroup.headers}>
                        {(header) => (
                          <TableHead>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                          </TableHead>
                        )}
                      </For>
                    </TableRow>
                  )}
                </For>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <form.Field name="code">
                      {(field) => (
                        <Input
                          type="text"
                          placeholder="Code"
                          name={field().name}
                          value={field().state.value}
                          onBlur={field().handleBlur}
                          onChange={(e) => field().handleChange(e.target.value)}
                        />
                      )}
                    </form.Field>
                  </TableCell>
                  <TableCell>
                    <form.Field name="name">
                      {(field) => (
                        <Input
                          type="text"
                          placeholder="Name"
                          name={field().name}
                          value={field().state.value}
                          onBlur={field().handleBlur}
                          onChange={(e) => field().handleChange(e.target.value)}
                        />
                      )}
                    </form.Field>
                  </TableCell>
                  <TableCell>
                    <form.Field name="decimal_digits">
                      {(field) => (
                        <Input
                          type="number"
                          placeholder="Decimal Digits"
                          name={field().name}
                          value={field().state.value}
                          onBlur={field().handleBlur}
                          onChange={(e) =>
                            field().handleChange(Number(e.target.value))
                          }
                        />
                      )}
                    </form.Field>
                  </TableCell>
                  <TableCell>
                    <Button type="submit">
                      <Save />
                    </Button>
                  </TableCell>
                </TableRow>
                <For each={table.getRowModel().rows}>
                  {(row) => (
                    <TableRow>
                      <For each={row.getVisibleCells()}>
                        {(cell) => (
                          <TableCell>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        )}
                      </For>
                    </TableRow>
                  )}
                </For>
              </TableBody>
            </Table>
          </form>
        </Match>
      </Switch>
    </PageLayout>
  );
}
