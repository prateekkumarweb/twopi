import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/app/docs")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/docs"!</div>;
}
