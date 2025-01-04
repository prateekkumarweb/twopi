import * as fs from "node:fs";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import clsx from "clsx";
import { authClient } from "~/lib/auth-client";

const filePath = "/tmp/count.txt";

async function readCount() {
  return parseInt(
    await fs.promises.readFile(filePath, "utf-8").catch(() => "0"),
  );
}

const getCount = createServerFn({
  method: "GET",
}).handler(() => {
  return readCount();
});

const updateCount = createServerFn({ method: "POST" })
  .validator((d: number) => d)
  .handler(async ({ data }) => {
    const count = await readCount();
    await fs.promises.writeFile(filePath, `${count + data}`);
  });

export const Route = createFileRoute("/")({
  component: Home,
  loader: async ({ context }) => {
    const count = await getCount();
    return { session: context.session, count };
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
      <div>
        <div>{JSON.stringify(state.session?.user.name)}</div>
        <button className={btn} onClick={signOut}>
          Sign out
        </button>
      </div>
      <button
        type="button"
        onClick={() => {
          updateCount({ data: 1 }).then(() => {
            router.invalidate();
          });
        }}
        className={btn}
      >
        Add 1 to {state.count}?
      </button>
      <button
        type="button"
        onClick={() => {
          updateCount({ data: -1 }).then(() => {
            router.invalidate();
          });
        }}
        className={btn}
      >
        Sub 1 from {state.count}?
      </button>
    </div>
  );
}
