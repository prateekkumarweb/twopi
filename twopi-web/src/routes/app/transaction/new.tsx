import { createFileRoute } from "@tanstack/react-router";
import TransactionEditor from "~/components/TransactionEditor";

export const Route = createFileRoute("/app/transaction/new")({
  component: RouteComponent,
});

function RouteComponent() {
  return <TransactionEditor />;
}
