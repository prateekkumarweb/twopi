import { createFileRoute, Link } from "@tanstack/solid-router";
import { buttonVariants } from "~/components/glass/Button";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    return { session: context.session, unauthorized: context.unauthorized };
  },
  component: Index,
});

function Index() {
  const state = Route.useLoaderData();

  return (
    <div class="bg-body-gradient flex min-h-screen flex-col items-center gap-4 p-4">
      <h1 class="text-xl font-bold">TwoPi</h1>
      {state().session?.user ? (
        <Link
          to="/app"
          class={buttonVariants({
            variant: "primary",
            size: "lg",
          })}
        >
          Go to app
        </Link>
      ) : (
        <Link
          to="/signin"
          class={buttonVariants({
            variant: "primary",
            size: "lg",
          })}
        >
          Sign in / Sign up
        </Link>
      )}
    </div>
  );
}
