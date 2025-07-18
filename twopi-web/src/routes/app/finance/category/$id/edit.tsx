import { useQuery } from "@tanstack/solid-query";
import { createFileRoute, Link } from "@tanstack/solid-router";
import { LucideArrowLeft } from "lucide-solid";
import { Show } from "solid-js";
import CategoryEditor from "~/components/CategoryEditor";
import { PageLayout } from "~/components/PageLayout";
import QueryWrapper from "~/components/QueryWrapper";
import { buttonVariants } from "~/components/glass/Button";
import { categoryQueryOptions } from "~/lib/query-options";

export const Route = createFileRoute("/app/finance/category/$id/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const categoriesQuery = useQuery(categoryQueryOptions);

  return (
    <PageLayout
      title="Edit Category"
      actions={
        <Link
          to=".."
          class={buttonVariants({
            variant: "secondary",
            size: "icon",
          })}
        >
          <LucideArrowLeft />
        </Link>
      }
    >
      <QueryWrapper
        queryResult={categoriesQuery}
        errorRender={(e) => <div>{e.message}</div>}
      >
        {(data) => (
          <Show
            when={data.categories.find((c) => c.id === params().id)}
            fallback={"Category not found!"}
          >
            {(data) => <CategoryEditor edit={data()} />}
          </Show>
        )}
      </QueryWrapper>
    </PageLayout>
  );
}
