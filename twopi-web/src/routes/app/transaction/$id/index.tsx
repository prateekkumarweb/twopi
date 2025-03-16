import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/app/transaction/$id/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/transaction/$id/"!</div>;
}
