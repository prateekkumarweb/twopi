import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Save, Trash } from "lucide-react";
import { useMemo } from "react";
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
import { currencyQueryOptions } from "~/lib/query-options";
import {
  createCurrency,
  deleteCurrency,
  syncCurrencies,
} from "~/lib/server-fns/currency";

export const Route = createFileRoute("/app/currency")({
  component: RouteComponent,
});

function RouteComponent() {
  const form = useForm({
    defaultValues: {
      code: "",
      name: "",
      decimalDigits: 0,
    },
    onSubmit: ({ value }) => {
      mutation.mutate(value);
    },
  });
  const queryClient = useQueryClient();
  const { isPending, error, data, isFetching } = useQuery(
    currencyQueryOptions(),
  );
  const mutation = useMutation({
    mutationFn: (data: unknown) =>
      createCurrency({ data }).then(() => {
        form.reset();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: currencyQueryOptions().queryKey,
      });
    },
  });

  const { mutate } = useMutation({
    mutationFn: (code: unknown) => deleteCurrency({ data: code }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: currencyQueryOptions().queryKey,
      });
    },
  });

  type Currency = {
    code: string;
    name: string;
    decimal_digits: number;
  };

  const columns = useMemo(
    () =>
      [
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
          id: "actions",
          header: "Actions",
          enableHiding: false,
          cell({ row }) {
            const currency = row.original;
            return (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  mutate(currency.code);
                }}
              >
                <Trash />
              </Button>
            );
          },
        },
      ] satisfies ColumnDef<Currency>[],
    [mutate],
  );

  const table = useReactTable({
    columns,
    data: data?.data ?? [],
    getCoreRowModel: getCoreRowModel(),
  });
  if (isPending) return "Loading...";

  if (isFetching) return "Fetching...";

  if (error) return "An error has occurred: " + error.message;

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center gap-4">
        <h1 className="grow text-xl font-bold">Currency</h1>
        <Button
          variant="outline"
          onClick={async () => {
            await syncCurrencies();
            await queryClient.invalidateQueries({
              queryKey: currencyQueryOptions().queryKey,
            });
          }}
        >
          Sync currencies
        </Button>
      </div>

      {mutation.isPending && <p className="text-accent">Creating...</p>}
      {mutation.isError && (
        <p className="text-destructive">{mutation.error?.message}</p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>
                <form.Field name="code">
                  {(field) => (
                    <Input
                      type="text"
                      placeholder="Code"
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
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
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  )}
                </form.Field>
              </TableCell>
              <TableCell>
                <form.Field name="decimalDigits">
                  {(field) => (
                    <Input
                      type="number"
                      placeholder="Decimal Digits"
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(Number(e.target.value))
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
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </form>
    </div>
  );
}
