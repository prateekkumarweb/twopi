import { useQueries } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import CategoryEditor from "~/components/CategoryEditor";
import { categoryQueryOptions } from "~/lib/query-options";

export const Route = createFileRoute("/app/category/$id/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const { data, isPending, errors } = useQueries({
    queries: [categoryQueryOptions()],
    combine: (results) => {
      return {
        data: results[0].data?.categories.find(
          (category) => category.id === params.id,
        ),
        isPending: results.some((result) => result.isPending),
        errors: results.map((result) => result.error).filter(Boolean),
      };
    },
  });

  if (isPending) return "Loading...";
  if (errors.length)
    return (
      <div>
        Error occurred:
        {errors.map((error, i) => (
          <div key={i}>{error?.message}</div>
        ))}
      </div>
    );

  if (!data) return "Not found";

  return <CategoryEditor edit={data} />;
}
