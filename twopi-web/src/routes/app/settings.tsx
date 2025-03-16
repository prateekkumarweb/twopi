import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/app/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/settings"!</div>;
}
