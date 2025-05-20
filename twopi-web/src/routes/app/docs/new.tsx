import { createFileRoute } from "@tanstack/solid-router";
import { LucidePlus, LucideTrash } from "lucide-solid";
import { marked } from "marked";
import { Index, Match, Switch } from "solid-js";
import { createStore } from "solid-js/store";
import { PageLayout } from "~/components/PageLayout";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";

export const Route = createFileRoute("/app/docs/new")({
  component: RouteComponent,
});

enum Tag {
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  P,
}

function RouteComponent() {
  const [blocks, setBlocks] = createStore<{ tag: Tag; content: string }[]>([
    { tag: Tag.H1, content: "Title 1" },
  ]);
  const [md, setMd] = createStore([
    `# Title 1\n## Title 2`,
    `# Title 1\n## Title 2`,
  ]);

  return (
    <PageLayout title="New Doc">
      <div class="flex h-full flex-col gap-4">
        <div class="prose">
          <Index each={blocks}>
            {(block, index) => (
              <div
                class="focus:outline-none"
                title={"Block: " + index}
                contentEditable
                onInput={(e) => {
                  let selection = window.getSelection();
                  if (!selection?.rangeCount) return;
                  let range = selection.getRangeAt(0);
                  const cursorPosition = range.startOffset;
                  setBlocks(index, "content", e.target.textContent ?? "");
                  selection = window.getSelection();
                  if (!selection?.rangeCount) return;
                  range = selection.getRangeAt(0);
                  range.setStart(range.startContainer, cursorPosition);
                  range.collapse(true);
                  selection?.removeAllRanges();
                  selection?.addRange(range);
                }}
              >
                <Switch>
                  <Match when={block().tag === Tag.H1}>
                    <h1>{block().content}</h1>
                  </Match>
                  <Match when={block().tag === Tag.H2}>
                    <h2>{block().content}</h2>
                  </Match>
                  <Match when={block().tag === Tag.H3}>
                    <h3>{block().content}</h3>
                  </Match>
                  <Match when={block().tag === Tag.H4}>
                    <h4>{block().content}</h4>
                  </Match>
                  <Match when={block().tag === Tag.H5}>
                    <h5>{block().content}</h5>
                  </Match>
                  <Match when={block().tag === Tag.H6}>
                    <h6>{block().content}</h6>
                  </Match>
                  <Match when={block().tag === Tag.P}>
                    <p>{block().content}</p>
                  </Match>
                </Switch>
              </div>
            )}
          </Index>
        </div>
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
