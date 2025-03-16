import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/app/account/$id/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/account/$id/"!</div>;
}
