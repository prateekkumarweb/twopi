import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import Layout from "~/components/AppLayout";

export const Route = createFileRoute("/app")({
  beforeLoad: ({ location, context }) => {
    if (!context.session?.user) {
      throw redirect({
        to: "/signin",
        search: {
          redirect: location.href,
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
    <Layout user={state.session?.user}>
      <Outlet />
    </Layout>
  );
}
