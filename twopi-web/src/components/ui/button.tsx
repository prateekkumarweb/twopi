import type { JSX, JSXElement } from "solid-js";

export function Button(props: {
  children?: JSXElement;
  type?: "button" | "submit" | "reset";
  onClick?: JSX.EventHandler<HTMLButtonElement, MouseEvent>;
}) {
  return (
    <button
      type={props.type}
      onClick={(e) => props.onClick?.(e)}
      class={
        "rounded-md border border-gray-400 px-3 py-1 hover:bg-gray-800 hover:text-gray-200"
      }
    >
      {props.children}
    </button>
  );
}
