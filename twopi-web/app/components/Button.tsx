import clsx from "clsx";
import type { DOMAttributes, ReactNode } from "react";

export default function Button(props: {
  children: ReactNode;
  onClick: DOMAttributes<HTMLButtonElement>["onClick"];
}) {
  const btn = clsx("rounded bg-blue-800 px-4 py-2 text-white");

  return (
    <button className={btn} onClick={props.onClick}>
      {props.children}
    </button>
  );
}
