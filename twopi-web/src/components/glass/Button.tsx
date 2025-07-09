import { Root } from "@kobalte/core/button";
import { cva, type VariantProps } from "class-variance-authority";
import { splitProps, type ComponentProps } from "solid-js";
import { cn } from "~/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-blue-300/30 bg-white/20 text-sm font-medium shadow-md outline-none backdrop-blur-md transition-all disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "text-blue-900 hover:bg-blue-200/30 hover:text-blue-950",
        secondary: "text-gray-800 hover:bg-gray-200/30 hover:text-gray-900",
        destructive:
          "border-red-300/40 text-red-900 hover:bg-red-200/30 hover:text-red-950",
        link: "border-none bg-transparent text-blue-700 underline-offset-2 shadow-none backdrop-blur-none hover:text-blue-900 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 gap-1.5 px-3",
        lg: "text-md h-10 px-6",
        icon: "flex size-9 h-10 w-10 items-center justify-center",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "primary",
    },
  },
);

function Button(
  props: ComponentProps<"button"> & VariantProps<typeof buttonVariants>,
) {
  const [local, others] = splitProps(props, [
    "variant",
    "size",
    "class",
    "children",
  ]);

  return (
    <Root
      data-slot="button"
      class={cn(
        buttonVariants({
          variant: local.variant,
          size: local.size,
          class: local.class,
        }),
      )}
      {...others}
    >
      {local.children}
    </Root>
  );
}

export { Button, buttonVariants };
