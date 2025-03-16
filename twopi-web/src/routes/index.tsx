import { createFileRoute, Link } from "@tanstack/solid-router";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    return { session: context.session, unauthorized: context.unauthorized };
  },
  component: Index,
});

function Index() {
  const state = Route.useLoaderData();

  return (
    <div class="m-4 flex flex-col items-center gap-4">
      <h1 class="text-xl font-bold">TwoPi</h1>
      {state().session?.user ? (
        <Link to="/app">Go to app</Link>
      ) : (
        <Link to="/signin">Sign in / Sign up</Link>
      )}
    </div>
  );
}
