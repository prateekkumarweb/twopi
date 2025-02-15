import { createFileRoute } from "@tanstack/react-router";
import AccountEditor from "~/components/AccountEditor";

export const Route = createFileRoute("/app/account/new")({
  component: RouteComponent,
});

function RouteComponent() {
  return <AccountEditor />;
}
