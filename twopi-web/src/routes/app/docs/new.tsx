import { createFileRoute } from "@tanstack/solid-router";
import { marked } from "marked";
import { createResource, createSignal } from "solid-js";
import { PageLayout } from "~/components/PageLayout";
import { Textarea } from "~/components/ui/textarea";

export const Route = createFileRoute("/app/docs/new")({
  component: RouteComponent,
});

function RouteComponent() {
  const [md, setMd] = createSignal(`# Title 1\n## Title 2`);
  const [html] = createResource(md, (md) => marked.parse(md));

  return (
    <PageLayout title="New Doc">
      <div class="flex h-full gap-4">
        <Textarea
          class="flex-1"
          value={md()}
          onInput={(md) => setMd(md.target.value)}
        />
        {/* eslint-disable-next-line solid/no-innerhtml */}
        <div innerHTML={html()} class="prose flex-1 rounded-lg border-2 p-4" />
      </div>
    </PageLayout>
  );
}
