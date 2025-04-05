import { splitProps, type ComponentProps } from "solid-js";
import { cn } from "~/lib/utils";

function Table(props: Readonly<ComponentProps<"table">>) {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <div data-slot="table-container" class="relative w-full overflow-x-auto">
      {/* eslint-disable-next-line sonarjs/table-header  */}
      <table
        data-slot="table"
        role="grid"
        class={cn("w-full caption-bottom text-sm", local.class)}
        {...others}
      />
    </div>
  );
}

function TableHeader(props: Readonly<ComponentProps<"thead">>) {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <thead
      data-slot="table-header"
      role="rowgroup"
      class={cn("[&_tr]:border-b", local.class)}
      {...others}
    />
  );
}

function TableBody(props: Readonly<ComponentProps<"tbody">>) {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <tbody
      data-slot="table-body"
      role="rowgroup"
      class={cn("[&_tr:last-child]:border-0", local.class)}
      {...others}
    />
  );
}

function TableFooter(props: Readonly<ComponentProps<"tfoot">>) {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <tfoot
      data-slot="table-footer"
      role="rowgroup"
      class={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        local.class,
      )}
      {...others}
    />
  );
}

function TableRow(props: Readonly<ComponentProps<"tr">>) {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <tr
      data-slot="table-row"
      role="row"
      class={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        local.class,
      )}
      {...others}
    />
  );
}

function TableHead(props: Readonly<ComponentProps<"th">>) {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <th
      data-slot="table-head"
      role="columnheader"
      class={cn(
        "text-foreground h-10 whitespace-nowrap px-2 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        local.class,
      )}
      {...others}
    />
  );
}

function TableCell(props: Readonly<ComponentProps<"td">>) {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <td
      data-slot="table-cell"
      role="gridcell"
      class={cn(
        "whitespace-nowrap p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        local.class,
      )}
      {...others}
    />
  );
}

function TableCaption(props: Readonly<ComponentProps<"caption">>) {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <caption
      data-slot="table-caption"
      class={cn("text-muted-foreground mt-4 text-sm", local.class)}
      {...others}
    />
  );
}

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
};
