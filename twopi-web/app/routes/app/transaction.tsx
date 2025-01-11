import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/transaction")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>TODO!</div>;
}
