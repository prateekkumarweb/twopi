import { createFileRoute } from "@tanstack/solid-router";
import { PageLayout } from "~/components/PageLayout";

export const Route = createFileRoute("/app/transaction/new")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PageLayout title="Transaction">
      <div>Hello "/app/transaction/new"!</div>
    </PageLayout>
  );
}
