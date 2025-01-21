import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/account/$id/delete")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  return <div>Hello /app/account/{params.id}/delete!</div>;
}
