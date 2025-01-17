import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRoute,
  Outlet,
  ScrollRestoration,
} from "@tanstack/react-router";
import { createServerFn, Meta, Scripts } from "@tanstack/start";
import { lazy, Suspense, type ReactNode } from "react";
import { getWebRequest } from "vinxi/http";
import Layout from "~/components/Layout";
import { auth } from "~/lib/server/auth";
import css from "../app.css?url";

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
      {
        name: "theme-color",
        content: "#123456",
      },
    ],
    links: [
      { rel: "icon", href: "/2pi.svg" },
      { rel: "stylesheet", href: css },
    ],
  }),
  beforeLoad: async () => {
    const { session } = await fetchAuth();
    return { session };
  },
  loader: async ({ context }) => {
    return { session: context.session };
  },
  component: RootComponent,
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
