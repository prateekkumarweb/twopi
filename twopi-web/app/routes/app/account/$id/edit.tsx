import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/account/$id/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  return <div>Hello /app/account/{params.id}/edit!</div>;
}
