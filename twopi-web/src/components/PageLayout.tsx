import type { JSX } from "solid-js";

export function PageLayout(props: {
  children?: JSX.Element;
  title: string;
  actions?: JSX.Element;
}) {
  return (
    <div class="w-full">
      <div class="mb-4 flex items-center gap-4">
        <h1 class="grow text-2xl font-semibold">{props.title}</h1>
        <div>{props.actions}</div>
      </div>
      {props.children}
    </div>
  );
}
