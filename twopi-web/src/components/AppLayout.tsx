import { Link, useRouter } from "@tanstack/solid-router";
import { User } from "lucide-solid";
import type { JSXElement } from "solid-js";
import { apiClient } from "~/lib/openapi";
import {
  AppSidebar,
  AppSidebarInset,
  AppSidebarToggleExternal,
} from "./AppSidebar";

export function AppLayout(props: {
  user?: {
    id: string;
    name: string;
    email: string;
  };
  children: JSXElement;
}) {
  const signOut = async () => {
    const router = useRouter();
    const { error } = await apiClient.POST("/twopi-api/api/signout");
    if (error) {
      throw new Error(error);
    }
    await router.invalidate();
    await router.navigate({ to: "/" });
  };

  return (
    <div class="flex h-screen w-full">
      <AppSidebar
        header={
          <Link to="/app" class="flex items-center gap-2">
            <img src="/2pi.svg" alt="TwoPi" class="h-8 w-8" />
            <h1 class="text-xl font-semibold">TwoPi</h1>
          </Link>
        }
      >
        Nav
      </AppSidebar>
      <AppSidebarInset>
        <nav class="border-b-1 flex h-16 items-center justify-between border-gray-200 p-4">
          <div class="flex items-center gap-2">
            <AppSidebarToggleExternal />
          </div>
          {props.user ? (
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <User />
                {props.user.name}
              </div>
              <div>
                <button onClick={signOut}>Sign out</button>
              </div>
            </div>
          ) : (
            <div>Not signed in</div>
          )}
        </nav>
        <div class="p-4">{props.children}</div>
      </AppSidebarInset>
    </div>
  );
}
