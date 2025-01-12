import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/transaction")({
  component: RouteComponent,
});

function RouteComponent() {
  const form = useForm({
    defaultValues: {},
  });

  return (
    <div className="w-full">
      <h2 className="my-4 text-xl font-bold">Transaction</h2>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      ></form>
      <div></div>
    </div>
  );
}
