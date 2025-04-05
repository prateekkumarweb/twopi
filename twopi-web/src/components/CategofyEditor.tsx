import { createForm } from "@tanstack/solid-form";
import { useMutation, useQueryClient } from "@tanstack/solid-query";
import { useNavigate } from "@tanstack/solid-router";
import { icons } from "lucide-solid";
import { For } from "solid-js";
import { createCategory } from "~/lib/api/category";
import { categoryQueryOptions } from "~/lib/query-options";
import { cn } from "~/lib/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function CategoryEditor(
  props: Readonly<{
    edit?: {
      id: string;
      name: string;
      group: string;
      icon: string;
    };
  }>,
) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const form = createForm(() => ({
    defaultValues: {
      id: props.edit?.id,
      name: props.edit?.name ?? "",
      group: props.edit?.group ?? "",
      icon: props.edit?.icon ?? "",
    },
    onSubmit: ({ value }) => {
      mutation.mutate(value);
    },
  }));
  const mutation = useMutation(() => ({
    mutationFn: async (data: {
      id?: string;
      name: string;
      group: string;
      icon: string;
    }) => {
      await createCategory(data);
      form.reset();
      navigate({
        to: "..",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(categoryQueryOptions());
    },
  }));
  return (
    <div class="w-full">
      <form
        class="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field name="name">
          {(field) => (
            <Input
              type="text"
              placeholder="Name"
              name={field().name}
              value={field().state.value}
              onBlur={field().handleBlur}
              onChange={(e) => field().handleChange(e.target.value)}
            />
          )}
        </form.Field>
        <form.Field name="group">
          {(field) => (
            <Input
              type="text"
              placeholder="Group"
              name={field().name}
              value={field().state.value}
              onBlur={field().handleBlur}
              onChange={(e) => field().handleChange(e.target.value)}
            />
          )}
        </form.Field>
        <form.Field name="icon">
          {(field) => (
            <select
              class={cn(
                "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input shadow-xs flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base outline-none transition-[color,box-shadow] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
              )}
              value={field().state.value}
              onChange={(e) => field().handleChange(e.target.value)}
            >
              <option value="">Select an icon</option>
              <For each={Object.keys(icons)}>
                {(icon) => (
                  <option value={icon} selected={field().state.value === icon}>
                    {icon}
                  </option>
                )}
              </For>
            </select>
          )}
        </form.Field>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {(val) => (
            <Button type="submit" disabled={!val()[0]}>
              {/* eslint-disable-next-line sonarjs/no-nested-conditional */}
              {val()[1] ? "..." : props.edit ? "Update" : "Create"}
            </Button>
          )}
        </form.Subscribe>
        {mutation.isError && (
          <p class="text-destructive">{mutation.error?.message}</p>
        )}
      </form>
    </div>
  );
}
