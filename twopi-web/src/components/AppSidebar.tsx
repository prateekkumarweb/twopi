import { Sidebar } from "lucide-solid";
import type { JSX } from "solid-js";
import { createSignal, Show } from "solid-js";

const [sidebarOpen, setSidebarOpen] = createSignal(false);

export function AppSidebar(props: {
  children?: JSX.Element;
  header?: JSX.Element;
}) {
  return (
    <Show when={sidebarOpen()}>
      <aside class="border-l-1 w-full border-gray-200 bg-gray-100 md:w-64">
        <div class="flex h-16 items-center gap-4 p-4">
          <AppSidebarToggle />
          <div>{props.header}</div>
        </div>
        <div class="p-4">{props.children}</div>
      </aside>
    </Show>
  );
}

export function AppSidebarInset(props: { children?: JSX.Element }) {
  return (
    <div
      class="w-full"
      classList={{ hidden: sidebarOpen(), "md:block": sidebarOpen() }}
    >
      {props.children}
    </div>
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
        document.startViewTransition(() => setSidebarOpen((open) => !open))
      }
      aria-label="Toggle sidebar"
    >
      <Sidebar />
    </button>
  );
}
