import { useQuery } from "@tanstack/solid-query";
import { createFileRoute, Link } from "@tanstack/solid-router";
import { Plus } from "lucide-solid";
import { For } from "solid-js";
import DynamicIcon from "~/components/DynamicIcon";
import { PageLayout } from "~/components/PageLayout";
import QueryWrapper from "~/components/QueryWrapper";
import { buttonVariants } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
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
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead class="px-6 py-4">Name</TableHead>
                  <TableHead class="px-6 py-4">Group</TableHead>
                  <TableHead class="px-6 py-4">Icon</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <For
                  each={data.groups}
                  fallback={<div>No categories found.</div>}
                >
                  {(group) => (
                    <For each={group.categories}>
                      {(category) => (
                        <TableRow>
                          <TableCell>
                            <Link
                              class={buttonVariants({ variant: "link" })}
                              to="/app/category/$id"
                              params={{ id: category.id }}
                            >
                              {category.name}
                            </Link>
                          </TableCell>
                          <TableCell>{group.group}</TableCell>
                          <TableCell>
                            {category.icon && (
                              <DynamicIcon
                                name={category.icon as "Loader"}
                                class="mr-2 inline-block h-4 w-4"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </For>
                  )}
                </For>
              </TableBody>
            </Table>
          </>
        )}
      </QueryWrapper>
    </PageLayout>
  );
}
