import { makePersisted } from "@solid-primitives/storage";
import { useLocation } from "@tanstack/solid-router";
import { LucideSidebar } from "lucide-solid";
import type { Accessor, JSX } from "solid-js";
import { createEffect, createMemo, createSignal, Show } from "solid-js";
import { useIsMobile } from "~/lib/utils";

// eslint-disable-next-line solid/reactivity
const [sidebarOpen, setSidebarOpen] = makePersisted(createSignal(false), {
  name: "sidebarOpen",
});

export function AppSidebar(
  props: Readonly<{
    children?: JSX.Element;
    header?: JSX.Element;
  }>,
) {
  const location = useLocation();
  const pathname = createMemo(() => location().pathname);
  const isMobile = useIsMobile();
  createEffect(() => {
    if (pathname() && isMobile()) {
      setSidebarOpen(false);
    }
  });

  return (
    <Show when={sidebarOpen()}>
      <aside class="border-r-1 flex w-full flex-col border-gray-300 p-4 md:w-64">
        {props.children}
      </aside>
    </Show>
  );
}

export function AppSidebarInset(
  props: Readonly<{
    children: JSX.Element | ((open: Accessor<boolean>) => JSX.Element);
  }>,
) {
  const children = () =>
    typeof props.children === "function"
      ? props.children(sidebarOpen)
      : props.children;

  return (
    <div
      class="m-4 w-full overflow-auto"
      classList={{ hidden: sidebarOpen(), "md:block": sidebarOpen() }}
    >
      {children()}
    </div>
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
      <LucideSidebar />
    </button>
  );
}
