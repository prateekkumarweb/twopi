import { Separator } from "@radix-ui/react-separator";
import { type ReactNode } from "react";
import type { User } from "~/lib/server/utils";
import { AppSidebar } from "./AppSidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "./ui/sidebar";

export default function Layout(props: { user?: User; children: ReactNode }) {
  return (
    <>
      <SidebarProvider>
        <AppSidebar user={props.user} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="font-semibold">TwoPi Personal Finance</h1>
          </header>
          <div className="m-4">{props.children}</div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
