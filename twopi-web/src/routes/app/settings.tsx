import { createFileRoute } from "@tanstack/solid-router";
import { PageLayout } from "~/components/PageLayout";

export const Route = createFileRoute("/app/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PageLayout title="Settings">
      <div>Hello "/app/settings"!</div>
    </PageLayout>
  );
}
