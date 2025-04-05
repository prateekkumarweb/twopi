import { createFileRoute, Link } from "@tanstack/solid-router";
import { ArrowLeft } from "lucide-solid";
import AccountEditor from "~/components/AccountEditor";
import { PageLayout } from "~/components/PageLayout";
import { buttonVariants } from "~/components/ui/button";

export const Route = createFileRoute("/app/account/new")({
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
            variant: "outline",
            size: "icon",
          })}
        >
          <ArrowLeft />
        </Link>
      }
    >
      <AccountEditor />
    </PageLayout>
  );
}
