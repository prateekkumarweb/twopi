import { Link, useRouter } from "@tanstack/solid-router";
import { Settings, User } from "lucide-solid";
import { type JSXElement } from "solid-js";
import { apiClient } from "~/lib/openapi";
import { AppSidebar, AppSidebarInset, AppSidebarToggle } from "./AppSidebar";
import { Button } from "./ui/button";

export function AppLayout(props: {
  user: {
    id: string;
    name: string;
    email: string;
  };
  children: JSXElement;
}) {
  return (
    <div class="flex h-screen w-full flex-col">
      <nav class="border-b-1 flex h-16 items-center justify-between border-gray-200 p-4">
        <div class="flex items-center gap-4">
          <AppSidebarToggle />
          <AppLogo />
        </div>
        <UserNav user={props.user} />
      </nav>
      <div class="grow-1 flex">
        <AppSidebar>
          <nav class="flex-grow">
            <div class="my-2 font-semibold">Personal Finance</div>
            <ul class="flex flex-col gap-1 text-gray-800 *:hover:underline">
              <li>
                <Link to="/app">Dashboard</Link>
              </li>
              <li>
                <Link to="/app/currency">Currency</Link>
              </li>
              <li>
                <Link to="/app/category">Category</Link>
              </li>
              <li>
                <Link to="/app/account">Account</Link>
              </li>
              <li>
                <Link to="/app/transaction">Transaction</Link>
              </li>
              <li>
                <Link to="/app/import-export">Import/Export</Link>
              </li>
            </ul>
          </nav>
          <div>
            <div class="flex items-center gap-2">
              <User class="inline-block" />
              {props.user.name}
            </div>
            <div>
              <Link to="/app/settings" class="flex items-center gap-2">
                <Settings /> Settings
              </Link>
            </div>
          </div>
        </AppSidebar>
        <AppSidebarInset>{props.children}</AppSidebarInset>
      </div>
    </div>
  );
}

function AppLogo() {
  return (
    <Link to="/app" class="flex items-center gap-2">
      <img src="/2pi.svg" alt="TwoPi" class="h-8 w-8" />
      <h1 class="text-xl font-semibold">TwoPi</h1>
    </Link>
  );
}

function UserNav(props: {
  user: {
    id: string;
    name: string;
    email: string;
  };
}) {
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
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2">
        <User />
        {props.user.name}
      </div>
      <div>
        <Button onClick={signOut}>Sign out</Button>
      </div>
    </div>
  );
}
