import { createFileRoute, Link } from "@tanstack/solid-router";
import { ArrowLeft } from "lucide-solid";
import CategoryEditor from "~/components/CategofyEditor";
import { PageLayout } from "~/components/PageLayout";

export const Route = createFileRoute("/app/category/new")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PageLayout
      title="New Category"
      actions={
        <Link to="..">
          <ArrowLeft />
        </Link>
      }
    >
      <CategoryEditor />
    </PageLayout>
  );
}
