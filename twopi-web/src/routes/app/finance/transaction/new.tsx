import { createFileRoute, Link } from "@tanstack/solid-router";
import { LucideArrowLeft } from "lucide-solid";
import { PageLayout } from "~/components/PageLayout";
import TransactionEditor from "~/components/TransactionEditor";
import { buttonVariants } from "~/components/glass/Button";

export const Route = createFileRoute("/app/finance/transaction/new")({
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
            variant: "secondary",
            size: "icon",
          })}
        >
          <LucideArrowLeft />
        </Link>
      }
    >
      <TransactionEditor />
    </PageLayout>
  );
}
