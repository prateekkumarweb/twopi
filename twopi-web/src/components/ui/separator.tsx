import * as SeparatorPrimitive from "@kobalte/core/separator";
import { type ComponentProps, splitProps } from "solid-js";
import { cn } from "~/lib/utils";

function Separator(props: ComponentProps<typeof SeparatorPrimitive.Root>) {
  const [local, others] = splitProps(props, [
    "class",
    "orientation",
    "decorative",
  ]);

  return (
    <SeparatorPrimitive.Root
      data-slot="separator-root"
      decorative={local.decorative}
      orientation={local.orientation ?? "horizontal"}
      class={cn(
        "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=vertical]:h-full data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px",
        local.class,
      )}
      {...others}
    />
  );
}

export { Separator };
