import { cva, type VariantProps } from "class-variance-authority";
import { type ComponentProps, splitProps } from "solid-js";
import { cn } from "~/lib/utils";

const badgeVariants = cva(
  "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium transition-[color,box-shadow] focus-visible:ring-[3px] [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground [a&]:hover:bg-primary/90 border-transparent",
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90 border-transparent",
        destructive:
          "bg-destructive [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 border-transparent text-white",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge(
  props: ComponentProps<"span"> & VariantProps<typeof badgeVariants>,
) {
  const [local, others] = splitProps(props, ["class", "variant"]);
  return (
    <span
      data-slot="badge"
      class={cn(badgeVariants({ variant: local.variant }), local.class)}
      {...others}
    />
  );
}

export { Badge, badgeVariants };
