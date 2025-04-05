import { createForm } from "@tanstack/solid-form";
import { useMutation, useQueryClient } from "@tanstack/solid-query";
import { useNavigate } from "@tanstack/solid-router";
import { icons } from "lucide-solid";
import { createCategory } from "~/lib/api/category";
import { categoryQueryOptions } from "~/lib/query-options";
import { Button } from "./ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxControl,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxItemLabel,
  ComboboxTrigger,
} from "./ui/combobox";
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
    onSuccess: async () => {
      await queryClient.invalidateQueries(categoryQueryOptions());
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
            <Combobox
              options={Object.keys(icons)}
              value={field().state.value}
              onChange={(e) => field().handleChange(e ?? "")}
              placeholder="Search icon..."
              itemComponent={(props) => (
                <ComboboxItem item={props.item}>
                  <ComboboxItemLabel>{props.item.rawValue}</ComboboxItemLabel>
                  <ComboboxItemIndicator />
                </ComboboxItem>
              )}
            >
              <ComboboxControl aria-label="Icon">
                <ComboboxInput />
                <ComboboxTrigger />
              </ComboboxControl>
              <ComboboxContent />
            </Combobox>
          )}
        </form.Field>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {(val) => (
            <Button type="submit" disabled={!val()[0]}>
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
