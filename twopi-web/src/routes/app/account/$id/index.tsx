import { createFileRoute } from "@tanstack/solid-router";
import { PageLayout } from "~/components/PageLayout";

export const Route = createFileRoute("/app/account/$id/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PageLayout title="Account">
      <div>Hello "/app/account/$id/"!</div>
    </PageLayout>
  );
}
