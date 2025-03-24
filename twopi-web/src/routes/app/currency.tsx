import { createFileRoute } from "@tanstack/solid-router";
import { PageLayout } from "~/components/PageLayout";
import { Button } from "~/components/ui/button";

export const Route = createFileRoute("/app/currency")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PageLayout title="Currency" actions={<Button>Sync</Button>}>
      <div>Hello "/app/currency/"!</div>
    </PageLayout>
  );
}
