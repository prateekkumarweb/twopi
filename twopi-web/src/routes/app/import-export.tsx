import { createFileRoute } from "@tanstack/solid-router";
import { PageLayout } from "~/components/PageLayout";

export const Route = createFileRoute("/app/import-export")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PageLayout title="Import/Export">
      <div>Hello "/app/import-export"!</div>
    </PageLayout>
  );
}
