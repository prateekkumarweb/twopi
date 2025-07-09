import { createFileRoute, Link } from "@tanstack/solid-router";
import { LucideArrowLeft } from "lucide-solid";
import CategoryEditor from "~/components/CategoryEditor";
import { PageLayout } from "~/components/PageLayout";
import { buttonVariants } from "~/components/glass/Button";

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
            variant: "secondary",
            size: "icon",
          })}
        >
          <LucideArrowLeft />
        </Link>
      }
    >
      <CategoryEditor />
    </PageLayout>
  );
}
