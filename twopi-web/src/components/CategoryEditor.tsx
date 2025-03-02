import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronsUpDown, icons } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import { useMemo, useState } from "react";
import { categoryQueryOptions } from "~/lib/query-options";
import { createCategory } from "~/lib/server-fns/category";
import { Button } from "./ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export default function CategoryEditor(props: {
  edit?: {
    id: string;
    name: string;
    group: string;
    icon: string;
  };
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const form = useForm({
    defaultValues: {
      id: props.edit?.id,
      name: props.edit?.name ?? "",
      group: props.edit?.group ?? "",
      icon: props.edit?.icon ?? "",
    },
    onSubmit: ({ value }) => {
      mutation.mutate(value);
    },
  });
  const mutation = useMutation({
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
      queryClient.invalidateQueries({
        queryKey: categoryQueryOptions().queryKey,
      });
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <Link to="..">
          <ArrowLeft />
        </Link>
        <h1 className="my-2 grow text-xl font-bold">
          {props.edit ? "Edit" : "New"} Category
        </h1>
      </div>
      <form
        className="flex flex-col gap-4"
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
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          )}
        </form.Field>
        <form.Field name="group">
          {(field) => (
            <Input
              type="text"
              placeholder="Group"
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          )}
        </form.Field>
        <form.Field name="icon">
          {(field) => (
            <Combobox
              options={Object.keys(icons).map((icon) => ({
                value: icon
                  .replace(/[A-Z0-9]/g, (m) => "-" + m.toLowerCase())
                  .slice(1),
                label: icon,
              }))}
              value={field.state.value}
              onChange={field.handleChange}
            />
          )}
        </form.Field>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? "..." : props.edit ? "Update" : "Create"}
            </Button>
          )}
        </form.Subscribe>
        {mutation.isError && (
          <p className="text-destructive">{mutation.error?.message}</p>
        )}
      </form>
    </div>
  );
}

function Combobox(props: {
  options: {
    value: string;
    label: string;
  }[];
  onChange: (value: string) => void;
  value: string;
}) {
  const [open, setOpen] = useState(false);

  const selectedOption = useMemo(
    () => props.options.find((option) => option.value === props.value),
    [props.options, props.value],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between"
        >
          {selectedOption ? (
            <span>
              <DynamicIcon
                name={selectedOption.value as "loader"}
                className="mr-2 inline-block h-4 w-4 opacity-60"
              />
              {selectedOption.label}
            </span>
          ) : (
            "Select ..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput placeholder="Search ..." />
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {props.options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    setOpen(false);
                    props.onChange(
                      currentValue === props.value ? "" : currentValue,
                    );
                  }}
                  className={props.value === option.value ? "bg-zinc-200" : ""}
                >
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
