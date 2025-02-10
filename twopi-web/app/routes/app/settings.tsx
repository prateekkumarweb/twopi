import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex w-full flex-col gap-4">
      <h1 className="text-xl font-bold">Settings</h1>
      <div>TODO</div>
    </div>
  );
}
