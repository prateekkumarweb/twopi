import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { authClient } from "~/lib/auth-client";

export const Route = createFileRoute("/")({
  component: Home,
  loader: async ({ context }) => {
    return { session: context.session };
  },
});

function Home() {
  const router = useRouter();
  const state = Route.useLoaderData();

  if (!state.session?.user) {
    return (
      <div className="m-4 flex flex-col gap-4">
        <Link to="/signin" className="underline">
          Sign in
        </Link>
        <Link to="/signup" className="underline">
          Sign up
        </Link>
      </div>
    );
  }

  const signOut = async () => {
    await authClient.signOut();
    await router.invalidate();
    await router.navigate({ to: "/" });
  };

  return (
    <div className="m-4 flex h-screen w-full flex-col items-center justify-center gap-4">
      <div>{JSON.stringify(state.session?.user.name)}</div>
      <button className="btn btn-primary" onClick={signOut}>
        Sign out
      </button>
      <Link to="/app">Go to app</Link>
    </div>
  );
}
