import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/app/transaction/new")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/transaction/new"!</div>;
}
