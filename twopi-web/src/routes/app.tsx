import { createFileRoute, Outlet, redirect } from "@tanstack/solid-router";
import { AppLayout } from "~/components/AppLayout";

export const Route = createFileRoute("/app")({
  beforeLoad: ({ location, context }) => {
    if (!context.session?.user && context.unauthorized) {
      throw redirect({
        to: "/signin",
        search: {
          next: location.href,
        },
      });
    }
  },
  loader: async ({ context }) => {
    return { session: context.session };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const state = Route.useLoaderData();

  return (
    <AppLayout user={state().session?.user}>
      <Outlet />
    </AppLayout>
  );
}
