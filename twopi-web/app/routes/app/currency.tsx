import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Save, Trash } from "lucide-react";
import {
  createCurrency,
  deleteCurrency,
  getCurrencies,
} from "~/lib/server-fns/currency";

export const Route = createFileRoute("/app/currency")({
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
    mutationFn: (data: unknown) =>
      createCurrency({ data }).then(() => {
        form.reset();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currencyData"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (code: unknown) => deleteCurrency({ data: code }),
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
      {mutation.isPending && <p className="text-info">Creating...</p>}
      {mutation.isError && (
        <p className="text-error">{mutation.error?.message}</p>
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
              <th>Base</th>
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
                <form.Field name="base">
                  {(field) => (
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
                    <td>{currency.base}</td>
                    <td>
                      <button
                        type="button"
                        className="d-btn d-btn-error"
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
