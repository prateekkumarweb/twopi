import { Separator } from "@radix-ui/react-separator";
import { Link, useRouterState } from "@tanstack/react-router";
import { type User } from "better-auth";
import { Fragment, type ReactNode } from "react";
import { AppSidebar, navItemsTree } from "./AppSidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "./ui/sidebar";

export default function Layout(props: { user?: User; children: ReactNode }) {
  const matches = useRouterState({
    select: (s) => s.matches,
  });
  const paths = matches
    .map((m) => m.pathname)
    .map((p) => ({ href: p, title: "TwoPi" }));

  let currentTree = navItemsTree;
  for (const path of paths.slice(1)) {
    const tree = currentTree.children?.find((c) => c.href === path.href);
    if (!tree) {
      break;
    }
    currentTree = tree;
    path.title = tree.label;
  }

  const currentPage = paths.pop();

  return (
    <>
      <SidebarProvider>
        <AppSidebar user={props.user} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {paths.map((path) => (
                  <Fragment key={path.href}>
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to={path.href}>{path.title}</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                  </Fragment>
                ))}
                <BreadcrumbItem>
                  <BreadcrumbPage>{currentPage?.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="m-4">{props.children}</div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
