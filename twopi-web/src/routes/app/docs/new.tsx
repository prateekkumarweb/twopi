import { createFileRoute } from "@tanstack/solid-router";
import { marked } from "marked";
import { createResource, createSignal, Index } from "solid-js";
import { PageLayout } from "~/components/PageLayout";
import { Textarea } from "~/components/ui/textarea";

export const Route = createFileRoute("/app/docs/new")({
  component: RouteComponent,
});

function RouteComponent() {
  const [md, setMd] = createSignal([
    `# Title 1\n## Title 2`,
    `# Title 1\n## Title 2`,
  ]);
  const [html] = createResource(md, (md) =>
    Promise.all(md.map((md) => marked.parse(md))),
  );

  return (
    <PageLayout title="New Doc">
      <div class="flex h-full flex-col gap-4">
        <Index each={md()}>
          {(item, index) => (
            <div class="flex gap-4">
              <Textarea
                class="flex-1"
                value={item()}
                onInput={(md) =>
                  setMd((v) => {
                    const r = [...v];
                    r[index] = md.currentTarget.value;
                    return r;
                  })
                }
              />
              {/* eslint-disable solid/no-innerhtml */}
              <div
                innerHTML={html()?.[index] ?? ""}
                class="prose flex-1 rounded-lg border-2 p-4"
              />
            </div>
          )}
        </Index>
      </div>
    </PageLayout>
  );
}
