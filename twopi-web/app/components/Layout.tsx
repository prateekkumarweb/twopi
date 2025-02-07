import { Separator } from "@radix-ui/react-separator";
import { Link, useRouter } from "@tanstack/react-router";
import { type User } from "better-auth";
import { type ReactNode } from "react";
import { authClient } from "~/lib/auth-client";
import { AppSidebar } from "./app-sidebar";
import { Button } from "./ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "./ui/sidebar";

export default function Layout(props: { user?: User; children: ReactNode }) {
  const router = useRouter();

  const signOut = async () => {
    await authClient.signOut();
    await router.invalidate();
    await router.navigate({ to: "/" });
  };

  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="grow">Personal Finance</h1>
            {props.user ? (
              <>
                <div>Hi {props.user.name}</div>
                <Button onClick={signOut} variant="default">
                  Sign out
                </Button>
              </>
            ) : (
              <Button asChild variant="default">
                <Link to="/signin">Sign in / Sign up</Link>
              </Button>
            )}
          </header>
          <div className="p-4">{props.children}</div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
