import { useMutation, useQuery, useQueryClient } from "@tanstack/solid-query";
import { createFileRoute, Link } from "@tanstack/solid-router";
import { ArrowLeft, Edit, Trash } from "lucide-solid";
import { Show } from "solid-js";
import DynamicIcon from "~/components/DynamicIcon";
import LabelAndValue from "~/components/LabelAndValue";
import { PageLayout } from "~/components/PageLayout";
import QueryWrapper from "~/components/QueryWrapper";
import { Button, buttonVariants } from "~/components/ui/button";
import { deleteCategory } from "~/lib/api/category";
import { categoryQueryOptions } from "~/lib/query-options";

export const Route = createFileRoute("/app/category/$id/")({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const params = Route.useParams();
  const categoriesQuery = useQuery(categoryQueryOptions);
  const navigate = Route.useNavigate();

  const mutation = useMutation(() => ({
    mutationFn: async (id: string) => {
      await deleteCategory(id);
      navigate({
        to: "..",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoryQueryOptions().queryKey,
      });
    },
  }));

  function deleteCategoryHandler() {
    if (window.confirm("Are you sure you want to delete this category?")) {
      mutation.mutate(params().id);
    }
  }

  return (
    <PageLayout
      title="Category details"
      actions={
        <>
          <Link
            to=".."
            class={buttonVariants({
              variant: "outline",
              size: "icon",
            })}
          >
            <ArrowLeft />
          </Link>
          <Link
            to="/app/category/$id/edit"
            params={{ id: params().id }}
            class={buttonVariants({
              variant: "outline",
              size: "icon",
            })}
          >
            <Edit />
          </Link>
          <Button
            variant="destructive"
            onClick={deleteCategoryHandler}
            disabled={mutation.isPending}
          >
            <Trash />
          </Button>
        </>
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
            {(data) => (
              <>
                <LabelAndValue label="Id" value={data().id} />
                <LabelAndValue label="Name" value={data().name} />
                <LabelAndValue label="Group" value={data().group} />
                <LabelAndValue
                  label="Icon"
                  value={
                    data().icon && (
                      <DynamicIcon name={data().icon as "Loader"} />
                    )
                  }
                />
                {/* TODO: Show related transaction */}
              </>
            )}
          </Show>
        )}
      </QueryWrapper>
    </PageLayout>
  );
}
