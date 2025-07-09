import { createFileRoute } from "@tanstack/solid-router";
import { Editor } from "@tiptap/core";
import Typography from "@tiptap/extension-typography";
import StarterKit from "@tiptap/starter-kit";
import { createSignal, onMount } from "solid-js";
import { PageLayout } from "~/components/PageLayout";

export const Route = createFileRoute("/app/docs/new")({
  component: RouteComponent,
});

function RouteComponent() {
  let editorRef: HTMLDivElement | undefined;
  const [editorJson, setEditorJson] = createSignal<string>("");

  onMount(() => {
    const editor = new Editor({
      element: editorRef,
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3, 4, 5, 6],
          },
        }),
        Typography,
      ],
      content: "<p>Hello World!</p>",
      autofocus: true,
      editable: true,
      editorProps: {
        attributes: {
          class:
            "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none",
        },
      },
      onUpdate: ({ editor }) => {
        const value = JSON.stringify(editor.getJSON(), null, 2);
        setEditorJson(value);
      },
    });
    setEditorJson(JSON.stringify(editor.getJSON(), null, 2));
  });

  return (
    <PageLayout title="New Doc">
      <div class="flex h-full gap-4">
        <div
          ref={editorRef}
          class="flex-1/2 rounded-2xl border-2 border-gray-200 p-2"
        />
        <pre class="flex-1/2 rounded-2xl border-2 border-gray-200 p-2">
          {editorJson()}
        </pre>
      </div>
    </PageLayout>
  );
}
