import { Link } from "@tanstack/solid-router";
import { Sidebar } from "lucide-solid";
import { createSignal, Show } from "solid-js";

const [sidebarOpen, setSidebarOpen] = createSignal(false);

export function AppSidebar() {
  return (
    <Show when={sidebarOpen()}>
      <aside class="border-l-1 w-64 border-gray-200 bg-gray-100">
        <div class="flex h-16 items-center gap-2 p-4">
          <AppSidebarToggle />
          <Link to="/app" class="flex items-center gap-2">
            <img src="/2pi.svg" alt="TwoPi" class="h-8 w-8" />
            <h1 class="text-xl font-semibold">TwoPi</h1>
          </Link>
        </div>
      </aside>
    </Show>
  );
}

export function AppSidebarToggleExternal() {
  return (
    <Show when={!sidebarOpen()}>
      <AppSidebarToggle />
    </Show>
  );
}

export function AppSidebarToggle() {
  return (
    <button
      onClick={() =>
        // document.startViewTransition(() => setSidebarOpen((open) => !open))
        setSidebarOpen((open) => !open)
      }
      aria-label="Toggle sidebar"
    >
      <Sidebar />
    </button>
  );
}
