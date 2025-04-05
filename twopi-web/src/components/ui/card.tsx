import { splitProps, type JSX } from "solid-js";
import { cn } from "~/lib/utils";

function Card(props: Readonly<JSX.HTMLAttributes<HTMLDivElement>>) {
  const [local, others] = splitProps(props, ["class"]);

  return (
    <div
      data-slot="card"
      class={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        local.class,
      )}
      {...others}
    />
  );
}

function CardHeader(props: Readonly<JSX.HTMLAttributes<HTMLDivElement>>) {
  const [local, others] = splitProps(props, ["class"]);

  return (
    <div
      data-slot="card-header"
      class={cn(
        "@container/card-header has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6 grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6",
        local.class,
      )}
      {...others}
    />
  );
}

function CardTitle(props: Readonly<JSX.HTMLAttributes<HTMLDivElement>>) {
  const [local, others] = splitProps(props, ["class"]);

  return (
    <div
      data-slot="card-title"
      class={cn("font-semibold leading-none", local.class)}
      {...others}
    />
  );
}

function CardDescription(props: Readonly<JSX.HTMLAttributes<HTMLDivElement>>) {
  const [local, others] = splitProps(props, ["class"]);

  return (
    <div
      data-slot="card-description"
      class={cn("text-muted-foreground text-sm", local.class)}
      {...others}
    />
  );
}

function CardAction(props: Readonly<JSX.HTMLAttributes<HTMLDivElement>>) {
  const [local, others] = splitProps(props, ["class"]);

  return (
    <div
      data-slot="card-action"
      class={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        local.class,
      )}
      {...others}
    />
  );
}

function CardContent(props: Readonly<JSX.HTMLAttributes<HTMLDivElement>>) {
  const [local, others] = splitProps(props, ["class"]);

  return (
    <div data-slot="card-content" class={cn("px-6", local.class)} {...others} />
  );
}

function CardFooter(props: Readonly<JSX.HTMLAttributes<HTMLDivElement>>) {
  const [local, others] = splitProps(props, ["class"]);

  return (
    <div
      data-slot="card-footer"
      class={cn("[.border-t]:pt-6 flex items-center px-6", local.class)}
      {...others}
    />
  );
}

export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
