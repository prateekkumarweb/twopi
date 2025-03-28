import { Root } from "@kobalte/core/button";
import clsx from "clsx";
import { type JSX, type JSXElement } from "solid-js";

const btnStyles = clsx(
  "cursor-pointer rounded-md border border-gray-400 px-3 py-1 hover:bg-gray-800 hover:text-gray-200",
);

export function Button(props: {
  children?: JSXElement;
  type?: "button" | "submit" | "reset";
  onClick?: JSX.EventHandler<HTMLButtonElement, MouseEvent>;
}) {
  return (
    <Root
      type={props.type}
      onClick={(e) => props.onClick?.(e)}
      class={btnStyles}
    >
      {props.children}
    </Root>
  );
}
