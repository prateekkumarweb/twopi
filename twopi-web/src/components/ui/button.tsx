import type { JSX, JSXElement } from "solid-js";

export function Button(props: {
  children?: JSXElement;
  class?: string;
  onClick?: JSX.EventHandler<HTMLButtonElement, MouseEvent>;
}) {
  return (
    <button class={props.class} onClick={(e) => props.onClick?.(e)}>
      {props.children}
    </button>
  );
}
