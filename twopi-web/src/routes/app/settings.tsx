import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { apiClient } from "~/lib/openapi";

export const Route = createFileRoute("/app/settings")({
  component: RouteComponent,
});

async function reset_account() {
  const { data, error } = await apiClient.POST("/twopi-api/api/reset-account");
  if (error) {
    throw new Error(error);
  }
  return data;
}

function RouteComponent() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onClickReset() {
    setError(null);
    try {
      await reset_account();
      router.navigate({
        to: "/",
      });
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
      console.error(error);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Settings</h1>
      <div>
        <Button variant="destructive" onClick={onClickReset}>
          Reset data
        </Button>
        {error && <p className="text-destructive">{error}</p>}
      </div>
    </div>
  );
}
