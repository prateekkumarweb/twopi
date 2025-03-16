import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/app/category/$id/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/category/$id/"!</div>;
}
