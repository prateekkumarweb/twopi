import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { SolidQueryDevtools } from "@tanstack/solid-query-devtools";
import { createRootRoute, Outlet } from "@tanstack/solid-router";
import { TanStackRouterDevtools } from "@tanstack/solid-router-devtools";
import "~/app.css";
import { apiClient } from "~/lib/openapi";

const queryClient = new QueryClient();

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
  component: () => (
    <>
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <SolidQueryDevtools />
      </QueryClientProvider>
      <TanStackRouterDevtools />
    </>
  ),
});
