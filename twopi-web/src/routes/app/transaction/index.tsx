import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/app/transaction/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/transaction/"!</div>;
}
