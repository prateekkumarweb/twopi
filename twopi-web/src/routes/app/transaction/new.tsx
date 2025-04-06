import { createFileRoute, Link } from "@tanstack/solid-router";
import { ArrowLeft } from "lucide-solid";
import { PageLayout } from "~/components/PageLayout";
import TransactionEditor from "~/components/TransactionEditor";
import { buttonVariants } from "~/components/ui/button";

export const Route = createFileRoute("/app/transaction/new")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PageLayout
      title="New Transaction"
      actions={
        <Link
          to=".."
          class={buttonVariants({
            variant: "outline",
            size: "icon",
          })}
        >
          <ArrowLeft />
        </Link>
      }
    >
      <TransactionEditor />
    </PageLayout>
  );
}
