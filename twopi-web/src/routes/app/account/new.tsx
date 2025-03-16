import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/app/account/new")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/account/new"!</div>;
}
