import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Trash } from "lucide-react";
import { categoryQueryOptions } from "~/lib/query-options";
import { createCategory, deleteCategory } from "~/lib/server-fns/category";

export const Route = createFileRoute("/app/category")({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const { isPending, error, data, isFetching } = useQuery(
    categoryQueryOptions(),
  );
  const form = useForm({
    defaultValues: {
      name: "",
      group: "",
    },
    onSubmit: ({ value }) => {
      mutation.mutate(value);
    },
  });
  const mutation = useMutation({
    mutationFn: (data: unknown) =>
      createCategory({ data }).then(() => {
        form.reset();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoryQueryOptions().queryKey,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (name: unknown) => deleteCategory({ data: name }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoryQueryOptions().queryKey,
      });
    },
  });

  if (isPending) return "Loading...";

  if (isFetching) return "Fetching...";

  if (error) return "An error has occurred: " + error.message;

  return (
    <div className="w-full">
      <h2 className="my-4 text-xl font-bold">Category</h2>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
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
        <form.Field name="group">
          {(field) => (
            <input
              type="text"
              className="w-full"
              placeholder="Group"
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          )}
        </form.Field>
        <button type="submit" className="d-btn d-btn-primary">
          Create
        </button>
        {mutation.isError && (
          <p className="text-error">{mutation.error?.message}</p>
        )}
      </form>
      <div className="mt-4 flex flex-col gap-4">
        {data.groups.map((group) => (
          <div
            className="bg-base-100 flex flex-col gap-4 p-2 shadow-sm"
            key={group.group}
          >
            <h2 className="text-lg">{group.group}</h2>
            <div className="flex flex-col gap-2">
              {group.categories.map((category) => (
                <div key={category.name} className="flex w-full">
                  <div className="grow text-sm text-gray-500">
                    {category.name}
                  </div>
                  <button
                    className="d-btn d-btn-error d-btn-outline d-btn-xs"
                    onClick={() => {
                      deleteMutation.mutate(category.name);
                    }}
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
