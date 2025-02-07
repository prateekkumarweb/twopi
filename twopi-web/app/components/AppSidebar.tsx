import { Link, useRouter } from "@tanstack/react-router";
import type { User as UserType } from "better-auth";
import { ChevronsUpDown, LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "~/components/ui/sidebar";
import { authClient } from "~/lib/auth-client";
import { Button } from "./ui/button";

export function AppSidebar(props: { user?: UserType }) {
  const { isMobile } = useSidebar();
  const router = useRouter();

  const signOut = async () => {
    await authClient.signOut();
    await router.invalidate();
    await router.navigate({ to: "/" });
  };

  return (
    <Sidebar>
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
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar>
                    <AvatarImage></AvatarImage>
                    <AvatarFallback className="rounded-lg">
                      <User />
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {props.user?.name}
                    </span>
                    <span className="truncate text-xs">
                      {props.user?.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage />
                      <AvatarFallback className="rounded-lg">
                        <User />
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {props.user?.name}
                      </span>
                      <span className="truncate text-xs">
                        {props.user?.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Button onClick={signOut} variant="ghost">
                    <LogOut />
                    Sign out
                  </Button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
