import EditorJS, { type ToolConstructable } from "@editorjs/editorjs";
import Header from "@editorjs/header";
import { createFileRoute } from "@tanstack/solid-router";
import { onMount } from "solid-js";
import { PageLayout } from "~/components/PageLayout";

export const Route = createFileRoute("/app/docs/new")({
  component: RouteComponent,
});

function RouteComponent() {
  let editorRef: HTMLDivElement | undefined;

  onMount(() => {
    const editor = new EditorJS({
      holder: editorRef,
      tools: {
        header: {
          class: Header as unknown as ToolConstructable,
          config: {
            levels: [1, 2, 3, 4, 5, 6],
            defaultLevel: 2,
          },
        },
      },
    });
    editor.isReady
      .then(() => {
        console.log("Editor.js is ready to work!");
      })
      .catch((reason) => {
        console.log(`Editor.js initialization failed because of ${reason}`);
      });
  });

  return (
    <PageLayout title="New Doc">
      <div class="flex h-full flex-col gap-4">
        <div ref={editorRef} class="rounded-2xl border-2" />
      </div>
    </PageLayout>
  );
}
