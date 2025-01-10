import {
  Outlet,
  ScrollRestoration,
  createRootRoute,
} from "@tanstack/react-router";
import { createServerFn, Meta, Scripts } from "@tanstack/start";
import { lazy, Suspense, type ReactNode } from "react";
import { auth } from "~/lib/server/auth";
import { getWebRequest } from "vinxi/http";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import Layout from "~/components/Layout";
import css from "../app.css?url";

import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import NotFound from "~/components/NotFound";

const TanStackRouterDevtools =
  process.env.NODE_ENV === "production"
    ? () => null
    : lazy(() =>
        import("@tanstack/router-devtools").then((res) => ({
          default: res.TanStackRouterDevtools,
        })),
      );

const fetchAuth = createServerFn({ method: "GET" }).handler(async () => {
  const session = await auth.api.getSession({
    headers: getWebRequest().headers,
  });
  return { session };
});

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "TwoPi",
      },
    ],
    links: [{ rel: "stylesheet", href: css }],
  }),
  beforeLoad: async () => {
    const { session } = await fetchAuth();
    return { session };
  },
  loader: async ({ context }) => {
    return { session: context.session };
  },
  component: RootComponent,
  errorComponent: (props) => {
    return (
      <RootDocument>
        <DefaultCatchBoundary {...props} />
      </RootDocument>
    );
  },
  notFoundComponent: () => <NotFound />,
});

function RootComponent() {
  const state = Route.useLoaderData();

  return (
    <RootDocument>
      <Layout user={state.session?.user}>
        <Outlet />
      </Layout>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html>
      <head>
        <Meta />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Suspense>
          <TanStackRouterDevtools />
        </Suspense>
        <ReactQueryDevtools />
        <Scripts />
      </body>
    </html>
  );
}
