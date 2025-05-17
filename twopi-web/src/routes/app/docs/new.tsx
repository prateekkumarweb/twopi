import { createFileRoute } from "@tanstack/solid-router";
import { LucidePlus, LucideTrash } from "lucide-solid";
import { marked } from "marked";
import { Index } from "solid-js";
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
                onInput={(md) => {
                  setMd(index, md.currentTarget.value);
                }}
              />
              <div
                innerHTML={marked.parse(item()) as string}
                class="prose flex-1 rounded-lg border-2 p-4"
              />
              <Button
                variant="destructive"
                onClick={() => {
                  const newMd = [...md];
                  newMd.splice(index, 1);
                  setMd(newMd);
                }}
              >
                <LucideTrash />
              </Button>
            </div>
          )}
        </Index>
        <div>
          <Button variant="default" onClick={() => setMd((v) => [...v, ""])}>
            <LucidePlus />
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}
