import { createFileRoute, Link } from "@tanstack/solid-router";
import { ArrowLeft } from "lucide-solid";
import CategoryEditor from "~/components/CategoryEditor";
import { PageLayout } from "~/components/PageLayout";
import { buttonVariants } from "~/components/ui/button";

export const Route = createFileRoute("/app/finance/category/new")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PageLayout
      title="New Category"
      actions={
        <Link
          to=".."
          class={buttonVariants({
            variant: "outline",
            size: "icon",
          })}
        >
          <ArrowLeft />
        </Link>
      }
    >
      <CategoryEditor />
    </PageLayout>
  );
}
