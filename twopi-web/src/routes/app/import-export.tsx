import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/app/import-export")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/import-export"!</div>;
}
