import { createFileRoute } from "@tanstack/solid-router";
import { LucidePlus } from "lucide-solid";
import { Button } from "~/components/glass/Button";

export const Route = createFileRoute("/preview")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div class="m-4">
      <h1 class="my-4 text-3xl font-semibold">Preview</h1>
      <div class="flex flex-col gap-4">
        <h2 class="text-xl font-semibold">Button</h2>
        <div class="flex gap-4">
          <Button>Click</Button>
          <Button variant="link">Link</Button>
          <Button disabled>Disabled</Button>
          <Button variant="destructive">Delete</Button>
          <Button variant="secondary">Secondary</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button size="icon">
            <LucidePlus />
          </Button>
        </div>
      </div>
    </div>
  );
}
