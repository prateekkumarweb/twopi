import { createFileRoute, useRouter } from "@tanstack/react-router";
import { authClient } from "~/lib/auth-client";
import { useState } from "react";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import Button from "~/components/Button";

const signinSearchParamsSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/signin")({
  component: RouteComponent,
  validateSearch: zodValidator(signinSearchParamsSchema),
  loader: async ({ context }) => {
    return { session: context.session };
  },
});

function RouteComponent() {
  const state = Route.useLoaderData();
  const search = Route.useSearch();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | undefined>();

  if (state.session?.user) {
    return <div>You are already signed in</div>;
  }

  const signIn = async () => {
    const { error } = await authClient.signIn.email({
      email,
      password,
    });
    if (error) {
      setErrorMsg(error.message);
    } else {
      await router.invalidate();
      if (search.redirect) {
        router.navigate({ to: search.redirect });
      } else {
        router.navigate({ to: "/" });
      }
    }
  };

  return (
    <div className="m-4 flex flex-col gap-4">
      <h1>Sign in</h1>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <div className="text-red-600">{errorMsg}</div>
      <Button onClick={signIn}>Sign in</Button>
    </div>
  );
}
