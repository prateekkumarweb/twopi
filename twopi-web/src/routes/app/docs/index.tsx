import { createFileRoute, Link } from "@tanstack/solid-router";
import { PageLayout } from "~/components/PageLayout";
import { buttonVariants } from "~/components/glass/Button";

export const Route = createFileRoute("/app/docs/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PageLayout
      title="Docs"
      actions={
        <Link to="/app/docs/new" class={buttonVariants({ variant: "primary" })}>
          New
        </Link>
      }
    >
      <div>Hello "/app/docs/"!</div>
    </PageLayout>
  );
}
