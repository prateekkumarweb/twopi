import { createFileRoute } from "@tanstack/solid-router";
import { Index, Match, Switch } from "solid-js";
import { createStore } from "solid-js/store";
import { PageLayout } from "~/components/PageLayout";

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
  const preserveWhitespace = (content: string) => {
    return content.replace(/^(\s+)/, (match) => {
      return "\u00A0".repeat(match.length);
    });
  };

  return (
    <Switch>
      <Match when={props.tag === Tag.H1}>
        <h1
          class={`mb-4 text-4xl font-bold tracking-tight text-gray-900 ${props.class || ""}`}
          contentEditable
          onInput={(e) => props.onInput(e)}
          onKeyDown={(e) => props.onKeyDown(e)}
          style={{ "white-space": "pre-wrap" }}
        >
          {preserveWhitespace(props.content)}
        </h1>
      </Match>
      <Match when={props.tag === Tag.H2}>
        <h2
          class={`mb-3 text-3xl font-semibold tracking-tight text-gray-800 ${props.class || ""}`}
          contentEditable
          onInput={(e) => props.onInput(e)}
          onKeyDown={(e) => props.onKeyDown(e)}
          style={{ "white-space": "pre-wrap" }}
        >
          {preserveWhitespace(props.content)}
        </h2>
      </Match>
      <Match when={props.tag === Tag.H3}>
        <h3
          class={`mb-2 text-2xl font-semibold text-gray-800 ${props.class || ""}`}
          contentEditable
          onInput={(e) => props.onInput(e)}
          onKeyDown={(e) => props.onKeyDown(e)}
          style={{ "white-space": "pre-wrap" }}
        >
          {preserveWhitespace(props.content)}
        </h3>
      </Match>
      <Match when={props.tag === Tag.H4}>
        <h4
          class={`mb-2 text-xl font-medium text-gray-800 ${props.class || ""}`}
          contentEditable
          onInput={(e) => props.onInput(e)}
          onKeyDown={(e) => props.onKeyDown(e)}
          style={{ "white-space": "pre-wrap" }}
        >
          {preserveWhitespace(props.content)}
        </h4>
      </Match>
      <Match when={props.tag === Tag.H5}>
        <h5
          class={`mb-1 text-lg font-medium text-gray-700 ${props.class || ""}`}
          contentEditable
          onInput={(e) => props.onInput(e)}
          onKeyDown={(e) => props.onKeyDown(e)}
          style={{ "white-space": "pre-wrap" }}
        >
          {preserveWhitespace(props.content)}
        </h5>
      </Match>
      <Match when={props.tag === Tag.H6}>
        <h6
          class={`mb-1 text-base font-medium text-gray-700 ${props.class || ""}`}
          contentEditable
          onInput={(e) => props.onInput(e)}
          onKeyDown={(e) => props.onKeyDown(e)}
          style={{ "white-space": "pre-wrap" }}
        >
          {preserveWhitespace(props.content)}
        </h6>
      </Match>
      <Match when={props.tag === Tag.P}>
        <p
          class={`mb-4 text-base leading-relaxed text-gray-600 ${props.class || ""}`}
          contentEditable
          onInput={(e) => props.onInput(e)}
          onKeyDown={(e) => props.onKeyDown(e)}
          style={{ "white-space": "pre-wrap" }}
        >
          {preserveWhitespace(props.content)}
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
    let content = e.target?.textContent ?? "";
    content = content.replace(/\u00A0/g, " ");

    setBlocks(index, "content", content);

    selection = window.getSelection();
    if (!selection?.rangeCount) return;
    range = selection.getRangeAt(0);
    range.setStart(range.startContainer, cursorPosition);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  /**
   * Handles keyboard events for editing blocks
   * - Enter: Splits block at cursor position
   * - Backspace: Merges blocks when at start of a block or deletes empty blocks
   */
  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const currentBlockElement = e.target as HTMLElement;
    const currentContent = currentBlockElement.textContent || "";
    const cursorPosition = range.startOffset;

    if (e.key === "Enter") {
      e.preventDefault();
      handleEnterKey(currentContent, cursorPosition, index);
    } else if (e.key === "Backspace") {
      if (cursorPosition === 0 && index > 0) {
        e.preventDefault();
        mergeWithPreviousBlock(currentContent, index);
      } else if (currentContent === "") {
        e.preventDefault();
        deleteEmptyBlock(index);
      }
    }
  };

  /**
   * Handles Enter key by splitting block at cursor position
   */
  const handleEnterKey = (
    fullContent: string,
    cursorPosition: number,
    index: number,
  ) => {
    const normalizedContent = fullContent.replace(/\u00A0/g, " ");
    const contentBeforeCursor = normalizedContent.substring(0, cursorPosition);
    const contentAfterCursor = normalizedContent.substring(cursorPosition);

    setBlocks(index, "content", contentBeforeCursor);

    const newBlock = {
      tag: Tag.P,
      content: contentAfterCursor,
    };

    setBlocks((blocks) => {
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      return newBlocks;
    });

    focusBlockAfterOperation(index + 1, 0, contentAfterCursor);
  };

  /**
   * Merges current block with the previous block
   */
  const mergeWithPreviousBlock = (currentContent: string, index: number) => {
    const prevBlockContent = blocks[index - 1]?.content || "";
    const normalizedPrevContent = prevBlockContent.replace(/\u00A0/g, " ");
    const normalizedCurrentContent = currentContent.replace(/\u00A0/g, " ");
    const mergedContent = normalizedPrevContent + normalizedCurrentContent;

    setBlocks(index - 1, "content", mergedContent);

    setBlocks((blocks) => {
      const newBlocks = [...blocks];
      newBlocks.splice(index, 1);
      return newBlocks;
    });

    focusBlockAfterOperation(index - 1, prevBlockContent.length);
  };

  /**
   * Deletes an empty block and moves cursor to end of previous block
   */
  const deleteEmptyBlock = (index: number) => {
    setBlocks((blocks) => {
      if (blocks.length === 1) return blocks;

      const newBlocks = [...blocks];
      newBlocks.splice(index, 1);
      return newBlocks;
    });

    if (index > 0) {
      focusBlockAfterOperation(index - 1, -1); // -1 means position at end
    }
  };

  /**
   * Helper function to focus a block after an operation
   * @param blockIndex - Index of block to focus
   * @param cursorPosition - Position to place cursor, -1 means at end
   * @param content - Optional content string for the block
   */
  const focusBlockAfterOperation = (
    blockIndex: number,
    cursorPosition: number,
    content?: string,
  ) => {
    setTimeout(() => {
      if (blockIndex < 0) return;

      const blockElement = document.querySelector(
        `[title="Block: ${blockIndex}"] [contenteditable]`,
      ) as HTMLElement;

      if (!blockElement) return;

      blockElement.focus();
      const selection = window.getSelection();
      if (!selection) return;

      const range = document.createRange();

      if (blockElement.firstChild) {
        if (cursorPosition === -1) {
          range.selectNodeContents(blockElement);
          range.collapse(false);
        } else {
          range.setStart(blockElement.firstChild, cursorPosition);
          range.collapse(true);
        }
      } else {
        const textNode = document.createTextNode(content || "");
        blockElement.appendChild(textNode);

        if (cursorPosition === -1) {
          range.setStart(textNode, textNode.length);
        } else {
          range.setStart(textNode, cursorPosition);
        }
        range.collapse(true);
      }

      selection.removeAllRanges();
      selection.addRange(range);
    }, 0);
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
      </div>
    </PageLayout>
  );
}
