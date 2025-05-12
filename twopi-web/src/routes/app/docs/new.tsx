import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/app/docs/new")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/docs/new"!</div>;
}
