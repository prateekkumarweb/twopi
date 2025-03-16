import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/app/category/new")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/category/new"!</div>;
}
