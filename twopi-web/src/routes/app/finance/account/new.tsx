import { createFileRoute, Link } from "@tanstack/solid-router";
import { LucideArrowLeft } from "lucide-solid";
import AccountEditor from "~/components/AccountEditor";
import { PageLayout } from "~/components/PageLayout";
import { buttonVariants } from "~/components/glass/Button";

export const Route = createFileRoute("/app/finance/account/new")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PageLayout
      title="New Account"
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
      <AccountEditor />
    </PageLayout>
  );
}
