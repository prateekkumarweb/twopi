import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { createServerFn, Meta, Scripts } from "@tanstack/start";
import { getWebRequest } from "@tanstack/start/server";
import { lazy, Suspense, type ReactNode } from "react";
import { apiClient } from "~/lib/openapi";
import css from "~/styles/app.css?url";

const TanStackRouterDevtools =
  process.env.NODE_ENV === "production"
    ? () => null
    : lazy(() =>
        import("@tanstack/router-devtools").then((res) => ({
          default: res.TanStackRouterDevtools,
        })),
      );

const fetchAuth = createServerFn({
  method: "GET",
}).handler(async () => {
  const headers = getWebRequest()?.headers;
  const { data, error } = await apiClient.GET("/twopi-api/api/user", {
    headers: {
      cookie: headers?.get("cookie"),
    },
  });
  if (error) {
    console.error("Auth Error", error);
  }
  return {
    session: data ? { user: data } : undefined,
  };
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
    return {
      session,
    };
  },
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
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
        <Suspense>
          <TanStackRouterDevtools />
        </Suspense>
        <ReactQueryDevtools />
        <Scripts />
      </body>
    </html>
  );
}
