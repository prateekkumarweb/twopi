import {
  Outlet,
  ScrollRestoration,
  createRootRoute,
} from "@tanstack/react-router";
import { createServerFn, Meta, Scripts } from "@tanstack/start";
import { type ReactNode } from "react";
import React from "react";
import css from "../app.css?url";

import "../app.css";
import { auth } from "~/lib/server/auth";
import { getWebRequest } from "vinxi/http";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import Layout from "~/components/Layout";

const fetchAuth = createServerFn({ method: "GET" }).handler(async () => {
  const session = await auth.api.getSession({
    headers: getWebRequest().headers,
  });
  return { session };
});

const TanStackRouterDevtools =
  process.env.NODE_ENV === "production"
    ? () => null
    : React.lazy(() =>
        import("@tanstack/router-devtools").then((res) => ({
          default: res.TanStackRouterDevtools,
        })),
      );

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
    links: [
      // FIXME: Hack because in build, the css is getting stripped off.
      { rel: "stylesheet", href: css },
    ],
  }),
  beforeLoad: async () => {
    const { session } = await fetchAuth();
    return { session };
  },
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Layout>
        <Outlet />
      </Layout>
      <TanStackRouterDevtools />
      <ReactQueryDevtools />
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
        <Scripts />
      </body>
    </html>
  );
}

function NotFoundComponent() {
  return <div>Not Found</div>;
}
