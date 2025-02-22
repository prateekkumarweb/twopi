import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, ChevronsUpDown, icons, Trash } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { categoryQueryOptions } from "~/lib/query-options";
import { createCategory, deleteCategory } from "~/lib/server-fns/category";
import { cn } from "~/lib/utils";

export const Route = createFileRoute("/app/category")({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const { isPending, error, data, isFetching } = useQuery(
    categoryQueryOptions(),
  );
  const form = useForm({
    defaultValues: {
      name: "",
      group: "",
      icon: "",
    },
    onSubmit: ({ value }) => {
      mutation.mutate(value);
    },
  });
  const mutation = useMutation({
    mutationFn: (data: { name: string; group: string; icon: string }) =>
      createCategory(data).then(() => {
        form.reset();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoryQueryOptions().queryKey,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoryQueryOptions().queryKey,
      });
    },
  });

  if (isPending) return "Loading...";

  if (isFetching) return "Fetching...";

  if (error) return "An error has occurred: " + error.message;

  return (
    <div className="w-full">
      <h1 className="mb-4 text-xl font-bold">Category</h1>
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
        <Button type="submit">Create</Button>
        {mutation.isError && (
          <p className="text-destructive">{mutation.error?.message}</p>
        )}
      </form>
      <div className="mt-4 flex flex-col gap-4">
        {data.groups.map((group) => (
          <Card key={group.group}>
            <CardHeader>
              <CardTitle>{group.group || "Ungrouped"}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {group.categories.map((category) => (
                <div className="flex w-full" key={category.name}>
                  <div className="my-auto grow text-sm text-gray-500">
                    <DynamicIcon
                      name={category.icon as "loader"}
                      className="mr-2 inline-block h-4 w-4"
                    />
                    {category.name}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      deleteMutation.mutate(category.id);
                    }}
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between"
        >
          {props.value ? (
            <span>
              <DynamicIcon
                name={props.value as "loader"}
                className="mr-2 inline-block h-4 w-4 opacity-60"
              />
              {
                props.options.find((option) => option.value === props.value)
                  ?.label
              }
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
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      props.value === option.value
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
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
