import * as AlertDialogPrimitive from "@kobalte/core/alert-dialog";
import { splitProps, type ComponentProps } from "solid-js";
import { cn } from "~/lib/utils";

function AlertDialog(
  props: Readonly<ComponentProps<typeof AlertDialogPrimitive.Root>>,
) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogTrigger(
  props: ComponentProps<typeof AlertDialogPrimitive.Trigger>,
) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  );
}

function AlertDialogPortal(
  props: Readonly<ComponentProps<typeof AlertDialogPrimitive.Portal>>,
) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  );
}

function AlertDialogOverlay(
  props: ComponentProps<typeof AlertDialogPrimitive.Overlay>,
) {
  const [local, others] = splitProps(props, ["class"]);

  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      class={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        local.class,
      )}
      {...others}
    />
  );
}

function AlertDialogContent(
  props: ComponentProps<typeof AlertDialogPrimitive.Content>,
) {
  const [local, others] = splitProps(props, ["class"]);

  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        class={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed left-[50%] top-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          local.class,
        )}
        {...others}
      />
    </AlertDialogPortal>
  );
}

function AlertDialogHeader(props: Readonly<ComponentProps<"div">>) {
  const [local, others] = splitProps(props, ["class"]);

  return (
    <div
      data-slot="alert-dialog-header"
      class={cn("flex flex-col gap-2 text-center sm:text-left", local.class)}
      {...others}
    />
  );
}

function AlertDialogFooter(props: Readonly<ComponentProps<"div">>) {
  const [local, others] = splitProps(props, ["class"]);

  return (
    <div
      data-slot="alert-dialog-footer"
      class={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        local.class,
      )}
      {...others}
    />
  );
}

function AlertDialogTitle(
  props: ComponentProps<typeof AlertDialogPrimitive.Title>,
) {
  const [local, others] = splitProps(props, ["class"]);

  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      class={cn("text-lg font-semibold", local.class)}
      {...others}
    />
  );
}

function AlertDialogDescription(
  props: ComponentProps<typeof AlertDialogPrimitive.Description>,
) {
  const [local, others] = splitProps(props, ["class"]);

  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      class={cn("text-muted-foreground text-sm", local.class)}
      {...others}
    />
  );
}

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
