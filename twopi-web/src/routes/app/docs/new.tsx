import { createFileRoute } from "@tanstack/solid-router";
import { marked } from "marked";
import { createResource, Index } from "solid-js";
import { createStore } from "solid-js/store";
import { PageLayout } from "~/components/PageLayout";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";

export const Route = createFileRoute("/app/docs/new")({
  component: RouteComponent,
});

function RouteComponent() {
  const [md, setMd] = createStore([
    `# Title 1\n## Title 2`,
    `# Title 1\n## Title 2`,
  ]);
  const [html] = createResource(
    () => md.slice(),
    (md) => Promise.all(md.map((md) => marked.parse(md))),
  );

  return (
    <PageLayout title="New Doc">
      <div class="flex h-full flex-col gap-4">
        {/* eslint-disable solid/no-innerhtml */}
        <Index each={md}>
          {(item, index) => (
            <div class="flex gap-4">
              <Textarea
                class="flex-1"
                value={item()}
                onInput={(md) => setMd(index, md.currentTarget.value)}
              />
              <div
                innerHTML={html()?.[index] ?? ""}
                class="prose flex-1 rounded-lg border-2 p-4"
              />
            </div>
          )}
        </Index>
        <Button variant="default" onClick={() => setMd((v) => [...v, ""])}>
          Add
        </Button>
      </div>
    </PageLayout>
  );
}
