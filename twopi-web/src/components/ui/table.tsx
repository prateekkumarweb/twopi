import { type ComponentProps } from "solid-js";
import { cn } from "~/lib/utils";

function Table(props: Readonly<ComponentProps<"table">>) {
  return (
    <div data-slot="table-container" class="relative w-full overflow-x-auto">
      {/* eslint-disable-next-line sonarjs/table-header  */}
      <table
        data-slot="table"
        role="grid"
        class={cn("w-full caption-bottom text-sm", props.class)}
        {...props}
      />
    </div>
  );
}

function TableHeader(props: Readonly<ComponentProps<"thead">>) {
  return (
    <thead
      data-slot="table-header"
      role="rowgroup"
      class={cn("[&_tr]:border-b", props.class)}
      {...props}
    />
  );
}

function TableBody(props: Readonly<ComponentProps<"tbody">>) {
  return (
    <tbody
      data-slot="table-body"
      role="rowgroup"
      class={cn("[&_tr:last-child]:border-0", props.class)}
      {...props}
    />
  );
}

function TableFooter(props: Readonly<ComponentProps<"tfoot">>) {
  return (
    <tfoot
      data-slot="table-footer"
      role="rowgroup"
      class={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        props.class,
      )}
      {...props}
    />
  );
}

function TableRow(props: Readonly<ComponentProps<"tr">>) {
  return (
    <tr
      data-slot="table-row"
      role="row"
      class={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        props.class,
      )}
      {...props}
    />
  );
}

function TableHead(props: Readonly<ComponentProps<"th">>) {
  return (
    <th
      data-slot="table-head"
      role="columnheader"
      class={cn(
        "text-foreground h-10 whitespace-nowrap px-2 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        props.class,
      )}
      {...props}
    />
  );
}

function TableCell(props: Readonly<ComponentProps<"td">>) {
  return (
    <td
      data-slot="table-cell"
      role="gridcell"
      class={cn(
        "whitespace-nowrap p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        props.class,
      )}
      {...props}
    />
  );
}

function TableCaption(props: Readonly<ComponentProps<"caption">>) {
  return (
    <caption
      data-slot="table-caption"
      class={cn("text-muted-foreground mt-4 text-sm", props.class)}
      {...props}
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
