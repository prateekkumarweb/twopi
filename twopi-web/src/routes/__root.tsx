import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import React, { Suspense } from "react";
import { apiClient } from "~/lib/openapi";
import "~/styles/app.css";

const queryClient = new QueryClient();

const TanStackRouterDevtools = import.meta.env.DEV
  ? React.lazy(() =>
      import("@tanstack/router-devtools").then((res) => ({
        default: res.TanStackRouterDevtools,
      })),
    )
  : () => null;

async function fetchAuth() {
  const { data, error, response } = await apiClient.GET("/twopi-api/api/user");
  if (response.status === 500) {
    console.error(response.statusText, response);
    throw new Error("Internal Server Error");
  }
  if (error) {
    console.error("Auth Error", error);
  }
  return {
    session: data ? { user: data } : undefined,
    unauthorized: response.status === 401,
  };
}

export const Route = createRootRoute({
  beforeLoad: async () => {
    const { session, unauthorized } = await fetchAuth();
    return {
      session,
      unauthorized,
    };
  },
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <ReactQueryDevtools />
      </QueryClientProvider>
      <Suspense>
        <TanStackRouterDevtools />
      </Suspense>
    </>
  );
}
