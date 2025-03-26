import { createFileRoute } from "@tanstack/solid-router";
import { PageLayout } from "~/components/PageLayout";

export const Route = createFileRoute("/app/account/$id/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PageLayout title="Account">
      <div>Hello "/app/account/$id/edit"!</div>
    </PageLayout>
  );
}
