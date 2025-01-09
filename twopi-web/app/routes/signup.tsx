import { createFileRoute, useRouter } from "@tanstack/react-router";
import { authClient } from "~/lib/auth-client";
import { useState } from "react";
import Button from "~/components/Button";

export const Route = createFileRoute("/signup")({
  component: RouteComponent,
  loader: async ({ context }) => {
    return { session: context.session };
  },
});

function RouteComponent() {
  const state = Route.useLoaderData();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | undefined>();

  if (state.session?.user) {
    return <div>You are already signed in</div>;
  }

  const signUp = async () => {
    const { error } = await authClient.signUp.email({
      email,
      password,
      name,
    });
    if (error) {
      setErrorMsg(error.message);
    } else {
      await router.invalidate();
      await router.navigate({ to: "/" });
    }
  };

  if (errorMsg) {
    return <div>{errorMsg}</div>;
  }

  return (
    <div className="m-4 flex flex-col gap-4">
      <h1>Sign up</h1>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />
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
      <Button onClick={signUp}>Sign up</Button>
    </div>
  );
}
