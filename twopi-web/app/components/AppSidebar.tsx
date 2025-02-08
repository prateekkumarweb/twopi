import { Link, useRouter } from "@tanstack/react-router";
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
import { apiClient } from "~/lib/openapi";
import { type User as UserType } from "~/lib/server/utils";
import { Button } from "./ui/button";

type NavItem = {
  label: string;
  href: string;
  children?: NavItem[];
};

const navItemsTree: NavItem = {
  label: "TwoPi",
  href: "/",
  children: [
    {
      label: "Personal Finance",
      href: "/app",
      children: [
        { label: "Dashboard", href: "/app/" },
        { label: "Currency", href: "/app/currency" },
        { label: "Category", href: "/app/category" },
        { label: "Account", href: "/app/account/" },
        { label: "Transaction", href: "/app/transaction/" },
        { label: "Import/Export", href: "/app/import-export" },
      ],
    },
  ],
};

export function AppSidebar(props: { user?: UserType }) {
  const { isMobile } = useSidebar();
  const router = useRouter();

  const signOut = async () => {
    const { error } = await apiClient.POST("/twopi-api/api/signout");
    if (error) {
      throw new Error(error);
    }
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
        {navItemsTree.children?.map((item) => (
          <SidebarGroup key={item.href}>
            <SidebarGroupLabel>{item.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  {item.children?.map((item) => (
                    <SidebarMenuButton key={item.href} asChild>
                      <Link to={item.href}>{item.label}</Link>
                    </SidebarMenuButton>
                  ))}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
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
