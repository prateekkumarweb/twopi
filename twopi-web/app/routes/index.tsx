import * as fs from "node:fs";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import clsx from "clsx";

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
  loader: async () => await getCount(),
});

function Home() {
  const router = useRouter();
  const state = Route.useLoaderData();

  const btn = clsx("rounded bg-blue-800 px-4 py-2 text-white");

  return (
    <div className="flex h-screen w-full items-center justify-center gap-4">
      <button
        type="button"
        onClick={() => {
          updateCount({ data: 1 }).then(() => {
            router.invalidate();
          });
        }}
        className={btn}
      >
        Add 1 to {state}?
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
        Sub 1 from {state}?
      </button>
    </div>
  );
}
