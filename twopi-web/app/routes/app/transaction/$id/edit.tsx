import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/transaction/$id/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  return <div>Hello /app/transaction/{params.id}/edit!</div>;
}
