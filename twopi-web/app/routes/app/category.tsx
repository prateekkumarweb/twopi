import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Trash } from "lucide-react";
import {
  createCategory,
  deleteCategory,
  getCategories,
} from "~/lib/server-fns/category";

export const Route = createFileRoute("/app/category")({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const { isPending, error, data, isFetching } = useQuery({
    queryKey: ["categoryData"],
    queryFn: async () => {
      const categories = (await getCategories()).categories;
      const groups = Array.from(
        new Set(categories.map((category) => category.group)),
      ).map((group) => ({
        group,
        categories: categories.filter((c) => c.group === group),
      }));
      return { categories, groups };
    },
  });
  const form = useForm({
    defaultValues: {
      name: "",
      group: "",
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value);
    },
  });
  const mutation = useMutation({
    mutationFn: (data: unknown) =>
      createCategory({ data }).then(() => {
        form.reset();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categoryData"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (name: unknown) => deleteCategory({ data: name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categoryData"] });
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
      </form>
      <div className="mt-4 flex flex-col gap-4">
        {data.groups.map((group) => (
          <div className="d-card bg-base-100 shadow-sm" key={group.group}>
            <div className="d-card-body">
              <h2 className="d-card-title">{group.group}</h2>
              <div className="flex flex-col gap-2">
                {group.categories.map((category) => (
                  <div
                    key={category.name}
                    className="flex w-full p-4 shadow-sm"
                  >
                    <div className="grow">{category.name}</div>
                    <button
                      className="d-btn d-btn-error d-btn-sm"
                      onClick={() => {
                        deleteMutation.mutate(category.name);
                      }}
                    >
                      <Trash />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
