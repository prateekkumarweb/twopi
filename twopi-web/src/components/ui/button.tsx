import { Root } from "@kobalte/core/button";
import clsx from "clsx";
import { type JSX, type JSXElement } from "solid-js";

const btnStyles = clsx(
  "cursor-pointer rounded-md border border-gray-400 px-3 py-1 hover:border-gray-600 hover:bg-gray-800 hover:text-gray-200",
);

type Variant = "primary" | "secondary" | "danger" | "success" | "warning";
const variantStyles = {
  primary: "bg-blue-500 text-white hover:bg-blue-600",
  secondary: "bg-gray-500 text-white hover:bg-gray-600",
  danger: "bg-red-500 text-white hover:bg-red-600",
  success: "bg-green-500 text-white hover:bg-green-600",
  warning: "bg-yellow-500 text-black hover:bg-yellow-600",
};

export function Button(props: {
  children?: JSXElement;
  type?: "button" | "submit" | "reset";
  variant?: Variant;
  onClick?: JSX.EventHandler<HTMLButtonElement, MouseEvent>;
}) {
  return (
    <Root
      type={props.type}
      onClick={(e) => props.onClick?.(e)}
      class={clsx(btnStyles, props.variant ? variantStyles[props.variant] : "")}
    >
      {props.children}
    </Root>
  );
}
