import { Link, useRouter } from "@tanstack/solid-router";
import {
  LucideBadgeDollarSign,
  LucideBanknote,
  LucideLayoutDashboard,
  LucideList,
  LucideSettings,
  LucideUpload,
  LucideUser,
  LucideWalletCards,
} from "lucide-solid";
import { type JSXElement } from "solid-js";
import { apiClient } from "~/lib/openapi";
import { AppSidebar, AppSidebarInset, AppSidebarToggle } from "./AppSidebar";
import { Button } from "./glass/Button";

export function AppLayout(
  props: Readonly<{
    user: {
      id: string;
      name: string;
      email: string;
    };
    children: JSXElement;
  }>,
) {
  return (
    <div class="bg-body-gradient flex h-screen w-full flex-col">
      <nav class="border-b-1 flex h-16 items-center justify-between border-gray-300 p-4">
        <div class="flex items-center gap-4">
          <AppSidebarToggle />
          <AppLogo />
        </div>
        <UserNav user={props.user} />
      </nav>
      <div class="grow-1 flex overflow-hidden">
        <AppSidebar>
          <nav class="flex-grow">
            <div class="my-2 font-semibold">Personal Finance</div>
            <ul class="flex flex-col gap-2 text-gray-800 *:hover:underline">
              <li>
                <Link to="/app/finance" class="flex items-center gap-2">
                  <LucideLayoutDashboard /> Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/app/finance/currency"
                  class="flex items-center gap-2"
                >
                  <LucideBadgeDollarSign /> Currency
                </Link>
              </li>
              <li>
                <Link
                  to="/app/finance/category"
                  class="flex items-center gap-2"
                >
                  <LucideList /> Category
                </Link>
              </li>
              <li>
                <Link to="/app/finance/account" class="flex items-center gap-2">
                  <LucideBanknote /> Account
                </Link>
              </li>
              <li>
                <Link
                  to="/app/finance/transaction"
                  class="flex items-center gap-2"
                >
                  <LucideWalletCards /> Transaction
                </Link>
              </li>
              <li>
                <Link
                  to="/app/finance/import-export"
                  class="flex items-center gap-2"
                >
                  <LucideUpload /> Import/Export
                </Link>
              </li>
            </ul>
            <div class="my-2 mt-6 font-semibold">Documents</div>
            <ul class="flex flex-col gap-2 text-gray-800 *:hover:underline">
              <li>
                <Link to="/app/docs" class="flex items-center gap-2">
                  <LucideLayoutDashboard /> Home
                </Link>
              </li>
            </ul>
          </nav>
          <div class="flex flex-col gap-4">
            <div class="flex items-center gap-2">
              <LucideUser class="inline-block" />
              {props.user.name}
            </div>
            <div>
              <Link to="/app/settings" class="flex items-center gap-2">
                <LucideSettings /> Settings
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

function UserNav(
  props: Readonly<{
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>,
) {
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
        <LucideUser />
        {props.user.name}
      </div>
      <div>
        <Button variant="secondary" onClick={signOut}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
