import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import clsx from "clsx";
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

  const btn = clsx("rounded bg-blue-800 px-4 py-2 text-white");

  if (!state.session?.user) {
    return (
      <div className="m-4 flex flex-col gap-4">
        <Link to="/signin" className={btn}>
          Sign in
        </Link>
        <Link to="/signup" className={btn}>
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
      <button className={btn} onClick={signOut}>
        Sign out
      </button>
      <a href="/app" className={btn}>
        Go to app
      </a>
    </div>
  );
}
