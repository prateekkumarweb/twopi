import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/app/account/$id/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/account/$id/edit"!</div>;
}
