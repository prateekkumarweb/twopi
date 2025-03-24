import { createFileRoute } from "@tanstack/solid-router";
import { PageLayout } from "~/components/PageLayout";

export const Route = createFileRoute("/app/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PageLayout title="Dashboard">
      <div>Hello "/app/"!</div>
    </PageLayout>
  );
}
