import { useQuery } from "@tanstack/solid-query";
import { createFileRoute, Link } from "@tanstack/solid-router";
import { ArrowLeft } from "lucide-solid";
import { Show } from "solid-js";
import CategoryEditor from "~/components/CategofyEditor";
import { PageLayout } from "~/components/PageLayout";
import QueryWrapper from "~/components/QueryWrapper";
import { categoryQueryOptions } from "~/lib/query-options";

export const Route = createFileRoute("/app/category/$id/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const categoriesQuery = useQuery(categoryQueryOptions);

  return (
    <PageLayout
      title="Edit Category"
      actions={
        <Link to="..">
          <ArrowLeft />
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
