import type { JSX } from "solid-js";

export function PageLayout(
  props: Readonly<{
    children?: JSX.Element;
    title: string;
    actions?: JSX.Element;
  }>,
) {
  return (
    <div class="flex h-full w-full flex-col">
      <div class="mb-4 flex items-center gap-4">
        <h1 class="grow text-2xl font-semibold">{props.title}</h1>
        <div class="flex gap-2">{props.actions}</div>
      </div>
      <div class="flex-1">{props.children}</div>
    </div>
  );
}
