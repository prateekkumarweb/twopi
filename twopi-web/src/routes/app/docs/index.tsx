import { createFileRoute, Link } from "@tanstack/solid-router";
import { buttonVariants } from "~/components/ui/button";

export const Route = createFileRoute("/app/docs/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      Hello "/app/docs/"!
      <div>
        <Link to="/app/docs/new" class={buttonVariants({ variant: "default" })}>
          New
        </Link>
      </div>
    </div>
  );
}
