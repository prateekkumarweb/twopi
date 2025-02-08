import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Trash } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
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
    mutationFn: (id: unknown) => deleteCategory({ data: id }),
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
      <h1 className="my-4 text-xl font-bold">Category</h1>
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
        <form.Field name="group">
          {(field) => (
            <Input
              type="text"
              placeholder="Group"
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          )}
        </form.Field>
        <Button type="submit">Create</Button>
        {mutation.isError && (
          <p className="text-error">{mutation.error?.message}</p>
        )}
      </form>
      <div className="mt-4 flex flex-col gap-4">
        {data.groups.map((group) => (
          <Card key={group.group}>
            <CardHeader>
              <CardTitle>{group.group || "Ungrouped"}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {group.categories.map((category) => (
                <div className="flex w-full" key={category.name}>
                  <div className="my-auto grow text-sm text-gray-500">
                    {category.name}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      deleteMutation.mutate(category.id);
                    }}
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
