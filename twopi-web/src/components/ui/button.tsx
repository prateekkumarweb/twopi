import type { JSX, JSXElement } from "solid-js";

export function Button(props: {
  children?: JSXElement;
  class?: string;
  type?: "button" | "submit" | "reset";
  onClick?: JSX.EventHandler<HTMLButtonElement, MouseEvent>;
}) {
  return (
    <button
      type={props.type}
      class={props.class}
      onClick={(e) => props.onClick?.(e)}
    >
      {props.children}
    </button>
  );
}
