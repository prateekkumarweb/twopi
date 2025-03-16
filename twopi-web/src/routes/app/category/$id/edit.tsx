import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/app/category/$id/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/category/$id/edit"!</div>;
}
