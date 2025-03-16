import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/app/transaction/$id/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/transaction/$id/edit"!</div>;
}
