import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Save, Trash } from "lucide-react";
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

  const deleteMutation = useMutation({
    mutationFn: (code: unknown) => deleteCurrency({ data: code }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: currencyQueryOptions().queryKey,
      });
    },
  });

  if (isPending) return "Loading...";

  if (isFetching) return "Fetching...";

  if (error) return "An error has occurred: " + error.message;

  return (
    <div className="w-full">
      <h1 className="my-4 text-xl font-bold">Currency</h1>
      {mutation.isPending && <p className="text-info-content">Creating...</p>}
      {mutation.isError && (
        <p className="text-error-content">{mutation.error?.message}</p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <table className="d-table w-full">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Decimal Places</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <form.Field name="code">
                  {(field) => (
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
                </form.Field>
              </td>
              <td>
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
              </td>
              <td>
                <form.Field name="decimalDigits">
                  {(field) => (
                    <input
                      type="number"
                      className="w-full"
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
              </td>
              <td>
                <button type="submit" className="d-btn d-btn-primary">
                  <Save />
                </button>
              </td>
            </tr>
            {data.currencies
              ? data.currencies.map((currency) => (
                  <tr key={currency.code}>
                    <td>{currency.code}</td>
                    <td>{currency.name}</td>
                    <td>{currency.decimalDigits}</td>
                    <td>
                      <button
                        type="button"
                        className="d-btn d-btn-error d-btn-outline"
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
      <button
        className="d-btn d-btn-accent"
        onClick={async () => {
          await syncCurrencies();
          await queryClient.invalidateQueries({
            queryKey: currencyQueryOptions().queryKey,
          });
        }}
      >
        Sync currencies
      </button>
    </div>
  );
}
