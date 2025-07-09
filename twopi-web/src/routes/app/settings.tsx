import { createFileRoute, useRouter } from "@tanstack/solid-router";
import { createSignal } from "solid-js";
import { Button } from "~/components/glass/Button";
import { PageLayout } from "~/components/PageLayout";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { apiClient } from "~/lib/openapi";

export const Route = createFileRoute("/app/settings")({
  component: RouteComponent,
});

async function resetAccount() {
  const { data, error } = await apiClient.POST("/twopi-api/api/reset-account");
  if (error) {
    throw new Error(error);
  }
  return data;
}

function RouteComponent() {
  const router = useRouter();
  const [error, setError] = createSignal<string | null>(null);
  const [open, setOpen] = createSignal(false);

  async function onClickReset() {
    setError(null);
    try {
      await resetAccount();
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
    <PageLayout title="Settings">
      <div>
        <AlertDialog open={open()} onOpenChange={setOpen}>
          <AlertDialogTrigger>
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
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => onClickReset()}>
                Continue
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {error && <p class="text-destructive">{error()}</p>}
      </div>
    </PageLayout>
  );
}
