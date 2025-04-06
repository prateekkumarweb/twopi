import * as ProgressPrimitive from "@kobalte/core/progress";
import { type ComponentProps, splitProps } from "solid-js";
import { cn } from "~/lib/utils";

function Progress(props: ComponentProps<typeof ProgressPrimitive.Root>) {
  const [local, others] = splitProps(props, ["class", "value"]);

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      class={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        local.class,
      )}
      {...others}
    >
      <ProgressPrimitive.Track
        class="bg-primary h-full w-full flex-1 transition-all"
        style={{ transform: `translateX(-${100 - (local.value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
