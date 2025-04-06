import { useQuery } from "@tanstack/solid-query";
import { createFileRoute, Link } from "@tanstack/solid-router";
import { Plus } from "lucide-solid";
import { For } from "solid-js";
import DynamicIcon from "~/components/DynamicIcon";
import { PageLayout } from "~/components/PageLayout";
import QueryWrapper from "~/components/QueryWrapper";
import { buttonVariants } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { categoryQueryOptions } from "~/lib/query-options";

export const Route = createFileRoute("/app/category/")({
  component: RouteComponent,
});

function RouteComponent() {
  const categoryQuery = useQuery(categoryQueryOptions);

  return (
    <PageLayout
      title="Category"
      actions={
        <>
          <Link
            to="/app/category/new"
            class={buttonVariants({
              variant: "outline",
              size: "icon",
            })}
          >
            <Plus />
          </Link>
        </>
      }
    >
      <QueryWrapper
        queryResult={categoryQuery}
        errorRender={(e) => <div>{e.message}</div>}
      >
        {(data) => (
          <For each={data.groups} fallback={<div>No categories found.</div>}>
            {(group) => (
              <Card class="mb-4 last:mb-0">
                <CardHeader>
                  <CardTitle>{group.group || "Ungrouped"}</CardTitle>
                </CardHeader>
                <CardContent class="flex flex-col gap-2 px-4">
                  <For each={group.categories}>
                    {(category) => (
                      <Link to="/app/category/$id" params={{ id: category.id }}>
                        <div class="border-1 my-auto grow rounded-md p-4 text-gray-500">
                          {category.icon && (
                            <DynamicIcon
                              name={category.icon as "Loader"}
                              class="mr-2 inline-block h-4 w-4"
                            />
                          )}
                          {category.name}
                        </div>
                      </Link>
                    )}
                  </For>
                </CardContent>
              </Card>
            )}
          </For>
        )}
      </QueryWrapper>
    </PageLayout>
  );
}
