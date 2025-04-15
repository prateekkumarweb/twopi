import * as AccordionPrimitive from "@kobalte/core/accordion";
import { ChevronDownIcon } from "lucide-solid";
import { splitProps, type ComponentProps } from "solid-js";
import { cn } from "~/lib/utils";

function Accordion(props: ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem(props: ComponentProps<typeof AccordionPrimitive.Item>) {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      class={cn("border-b last:border-b-0", local.class)}
      {...others}
    />
  );
}

function AccordionTrigger(
  props: ComponentProps<typeof AccordionPrimitive.Trigger>,
) {
  const [local, others] = splitProps(props, ["class", "children"]);
  return (
    <AccordionPrimitive.Header class="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        class={cn(
          "focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium outline-none transition-all hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
          local.class,
        )}
        {...others}
      >
        {local.children}
        <ChevronDownIcon class="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent(
  props: ComponentProps<typeof AccordionPrimitive.Content>,
) {
  const [local, others] = splitProps(props, ["class", "children"]);
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      class="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
      {...others}
    >
      <div class={cn("pb-4 pt-0", local.class)}>{local.children}</div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
