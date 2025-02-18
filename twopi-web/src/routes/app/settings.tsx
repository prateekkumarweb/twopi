import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
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
  const [open, setOpen] = useState(false);

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
    } finally {
      setOpen(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Settings</h1>
      <div>
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Reset data</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  onClickReset();
                }}
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {error && <p className="text-destructive">{error}</p>}
      </div>
    </div>
  );
}
