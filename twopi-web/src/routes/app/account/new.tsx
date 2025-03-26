import { createFileRoute } from "@tanstack/solid-router";
import { PageLayout } from "~/components/PageLayout";

export const Route = createFileRoute("/app/account/new")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PageLayout title="Account">
      <div>Hello "/app/account/new"!</div>
    </PageLayout>
  );
}
