import { createFileRoute } from "@tanstack/solid-router";
import { LucidePlus } from "lucide-solid";
import { Index, Match, Switch } from "solid-js";
import { createStore } from "solid-js/store";
import { PageLayout } from "~/components/PageLayout";
import { Button } from "~/components/ui/button";

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

function WrapTag(
  props: Readonly<{
    tag: Tag;
    content: string;
    onInput: (e: InputEvent) => void;
    onKeyDown: (e: KeyboardEvent) => void;
    class?: string;
  }>,
) {
  return (
    <Switch>
      <Match when={props.tag === Tag.H1}>
        <h1
          class={props.class}
          contentEditable
          onInput={(e) => props.onInput(e)}
          onKeyDown={(e) => props.onKeyDown(e)}
        >
          {props.content}
        </h1>
      </Match>
      <Match when={props.tag === Tag.H2}>
        <h2
          class={props.class}
          contentEditable
          onInput={(e) => props.onInput(e)}
          onKeyDown={(e) => props.onKeyDown(e)}
        >
          {props.content}
        </h2>
      </Match>
      <Match when={props.tag === Tag.H3}>
        <h3
          class={props.class}
          contentEditable
          onInput={(e) => props.onInput(e)}
          onKeyDown={(e) => props.onKeyDown(e)}
        >
          {props.content}
        </h3>
      </Match>
      <Match when={props.tag === Tag.H4}>
        <h4
          class={props.class}
          contentEditable
          onInput={(e) => props.onInput(e)}
          onKeyDown={(e) => props.onKeyDown(e)}
        >
          {props.content}
        </h4>
      </Match>
      <Match when={props.tag === Tag.H5}>
        <h5
          class={props.class}
          contentEditable
          onInput={(e) => props.onInput(e)}
          onKeyDown={(e) => props.onKeyDown(e)}
        >
          {props.content}
        </h5>
      </Match>
      <Match when={props.tag === Tag.H6}>
        <h6
          class={props.class}
          contentEditable
          onInput={(e) => props.onInput(e)}
          onKeyDown={(e) => props.onKeyDown(e)}
        >
          {props.content}
        </h6>
      </Match>
      <Match when={props.tag === Tag.P}>
        <p
          class={props.class}
          contentEditable
          onInput={(e) => props.onInput(e)}
          onKeyDown={(e) => props.onKeyDown(e)}
        >
          {props.content}
        </p>
      </Match>
    </Switch>
  );
}

function RouteComponent() {
  const [blocks, setBlocks] = createStore<{ tag: Tag; content: string }[]>([
    { tag: Tag.H1, content: "Title 1" },
  ]);

  const onInput = (e: InputEvent, index: number) => {
    let selection = window.getSelection();
    if (!selection?.rangeCount) return;
    let range = selection.getRangeAt(0);
    const cursorPosition = range.startOffset;
    // @ts-expect-error "textContent" is defined on the target
    setBlocks(index, "content", e.target?.textContent ?? "");
    selection = window.getSelection();
    if (!selection?.rangeCount) return;
    range = selection.getRangeAt(0);
    range.setStart(range.startContainer, cursorPosition);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const newBlock = {
        tag: Tag.P,
        content: "",
      };
      setBlocks((blocks) => [...blocks, newBlock]);
      setTimeout(() => {
        const newBlockIndex = index + 1;
        const newBlockElement = document.querySelector(
          `[title="Block: ${newBlockIndex}"] [contenteditable]`,
        ) as HTMLElement;
        if (newBlockElement) {
          newBlockElement.focus();
          const selection = window.getSelection();
          if (selection && newBlockElement.firstChild) {
            const range = document.createRange();
            range.setStart(newBlockElement.firstChild, 0);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          } else if (selection) {
            const textNode = document.createTextNode("");
            newBlockElement.appendChild(textNode);
            const range = document.createRange();
            range.setStart(textNode, 0);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      }, 0);
    } else if (e.key === "Backspace") {
      // @ts-expect-error "textContent" is defined on the target
      if (e.target?.textContent === "") {
        e.preventDefault();
        setBlocks((blocks) => {
          if (blocks.length === 1) return blocks;
          const newBlocks = [...blocks];
          newBlocks.splice(index, 1);
          return newBlocks;
        });
        setTimeout(() => {
          const prevBlockIndex = index - 1;
          if (prevBlockIndex >= 0) {
            const prevBlockElement = document.querySelector(
              `[title="Block: ${prevBlockIndex}"] [contenteditable]`,
            ) as HTMLElement;
            if (prevBlockElement) {
              prevBlockElement.focus();
              const selection = window.getSelection();
              if (selection) {
                const range = document.createRange();
                if (prevBlockElement.lastChild) {
                  range.selectNodeContents(prevBlockElement);
                  range.collapse(false); // false means collapse to end
                } else {
                  const textNode = document.createTextNode("");
                  prevBlockElement.appendChild(textNode);
                  range.setStart(textNode, 0);
                  range.collapse(true);
                }
                selection.removeAllRanges();
                selection.addRange(range);
              }
            }
          }
        }, 0);
      }
    }
  };

  return (
    <PageLayout title="New Doc">
      <div class="flex h-full flex-col gap-4">
        <Index each={blocks}>
          {(block, index) => (
            <div class="rounded-lg bg-gray-100 p-4" title={"Block: " + index}>
              <WrapTag
                class="focus:outline-none"
                tag={block().tag}
                content={block().content}
                onInput={(e) => {
                  onInput(e, index);
                }}
                onKeyDown={(e) => {
                  onKeyDown(e, index);
                }}
              />
            </div>
          )}
        </Index>
        <Button
          variant="default"
          onClick={() => setBlocks((v) => [...v, { tag: Tag.P, content: "" }])}
        >
          <LucidePlus />
        </Button>
      </div>
    </PageLayout>
  );
}
