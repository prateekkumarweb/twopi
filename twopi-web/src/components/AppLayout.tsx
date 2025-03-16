import type { JSXElement } from "solid-js";

export default function Layout(props: {
  user?: {
    id: string;
    name: string;
    email: string;
  };
  children: JSXElement;
}) {
  return (
    <div>
      <h1>TwoPi Personal Finance</h1>
      <div>{props.children}</div>
    </div>
  );
}
