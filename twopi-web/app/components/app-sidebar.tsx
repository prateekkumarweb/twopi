import { Link } from "@tanstack/react-router";
import type * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "~/components/ui/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="p-2 font-semibold">
          <Link to="/">TwoPi</Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Personal Finance</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/app">Home</Link>
                </SidebarMenuButton>
                <SidebarMenuButton asChild>
                  <Link to="/app/currency">Currency</Link>
                </SidebarMenuButton>
                <SidebarMenuButton asChild>
                  <Link to="/app/category">Category</Link>
                </SidebarMenuButton>
                <SidebarMenuButton asChild>
                  <Link to="/app/account">Account</Link>
                </SidebarMenuButton>
                <SidebarMenuButton asChild>
                  <Link to="/app/transaction">Transaction</Link>
                </SidebarMenuButton>
                <SidebarMenuButton asChild>
                  <Link to="/app/import-export">Import/Export</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
