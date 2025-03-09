import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    return { session: context.session, unauthorized: context.unauthorized };
  },
  component: Home,
});

function Home() {
  const state = Route.useLoaderData();

  return (
    <div className="m-4 flex flex-col items-center gap-4">
      <h1 className="text-xl font-bold">TwoPi</h1>
      <Button asChild>
        {state.session?.user ? (
          <Link to="/app">Go to app</Link>
        ) : (
          <Link to="/signin">Sign in / Sign up</Link>
        )}
      </Button>
    </div>
  );
}
