import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Edit, Plus, Trash } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { categoryQueryOptions } from "~/lib/query-options";
import { createCategory, deleteCategory } from "~/lib/server-fns/category";

export const Route = createFileRoute("/app/category/")({
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
      icon: "",
    },
    onSubmit: ({ value }) => {
      mutation.mutate(value);
    },
  });
  const mutation = useMutation({
    mutationFn: (data: { name: string; group: string; icon: string }) =>
      createCategory(data).then(() => {
        form.reset();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoryQueryOptions().queryKey,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
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
      <div className="flex items-center gap-2">
        <h1 className="my-2 grow text-xl font-bold">Category</h1>
        <Button asChild variant="outline">
          <Link to="/app/category/new">
            <Plus />
          </Link>
        </Button>
      </div>
      <div className="mt-4 flex flex-col gap-4">
        {data.groups.map((group) => (
          <Card key={group.group}>
            <CardHeader>
              <CardTitle>{group.group || "Ungrouped"}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {group.categories.map((category) => (
                <div className="flex w-full gap-2" key={category.name}>
                  <div className="my-auto grow text-sm text-gray-500">
                    {category.icon && (
                      <DynamicIcon
                        name={category.icon as "loader"}
                        className="mr-2 inline-block h-4 w-4"
                      />
                    )}
                    {category.name}
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link
                      to="/app/category/$id/edit"
                      params={{ id: category.id }}
                    >
                      <Edit size={16} />
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
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
