import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/app/currency")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/currency"!</div>;
}
