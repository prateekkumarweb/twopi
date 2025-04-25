import { useQuery } from "@tanstack/solid-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/solid-router";
import { LucidePlus } from "lucide-solid";
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

export const Route = createFileRoute("/app/finance/category/")({
  component: RouteComponent,
});

function RouteComponent() {
  const categoryQuery = useQuery(categoryQueryOptions);
  const navigate = useNavigate();

  return (
    <PageLayout
      title="Category"
      actions={
        <>
          <Link
            to="/app/finance/category/new"
            class={buttonVariants({
              variant: "outline",
              size: "icon",
            })}
          >
            <LucidePlus />
          </Link>
        </>
      }
    >
      <QueryWrapper
        queryResult={categoryQuery}
        errorRender={(e) => <div>{e.message}</div>}
      >
        {(data) => (
          <Table>
            <TableHeader>
              <TableRow class="*:py-4">
                <TableHead>Name</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Icon</TableHead>
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
                      <TableRow
                        onClick={() => {
                          navigate({
                            to: "/app/finance/category/$id",
                            params: {
                              id: category.id,
                            },
                          });
                        }}
                        class="cursor-pointer *:py-4"
                      >
                        <TableCell>{category.name}</TableCell>
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
        )}
      </QueryWrapper>
    </PageLayout>
  );
}
