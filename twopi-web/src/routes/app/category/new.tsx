import { createFileRoute } from "@tanstack/solid-router";
import { PageLayout } from "~/components/PageLayout";

export const Route = createFileRoute("/app/category/new")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PageLayout title="Category">
      <div>Hello "/app/category/new"!</div>
    </PageLayout>
  );
}
