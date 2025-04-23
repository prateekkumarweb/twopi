import { createFileRoute, redirect } from "@tanstack/solid-router";

export const Route = createFileRoute("/app/")({
  component: RouteComponent,
});

function RouteComponent() {
  redirect({
    to: "/app/finance",
  });

  return <div>Hello "/app/"!</div>;
}
