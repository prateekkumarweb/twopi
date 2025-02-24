import { createFileRoute } from "@tanstack/react-router";
import CategoryEditor from "~/components/CategoryEditor";

export const Route = createFileRoute("/app/category/new")({
  component: RouteComponent,
});

function RouteComponent() {
  return <CategoryEditor />;
}
