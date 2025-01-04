import { createFileRoute, useRouter } from "@tanstack/react-router";
import { authClient } from "~/lib/auth-client";
import { useState } from "react";

export const Route = createFileRoute("/signin")({
  component: RouteComponent,
  loader: async () => {
    const { data, error } = await authClient.getSession();
    if (error) {
      return { session: null };
    } else {
      return { session: data };
    }
  },
});

function RouteComponent() {
  const state = Route.useLoaderData();
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
      router.invalidate();
      router.navigate({ to: "/" });
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
      <button className="bg-blue-800 px-4 py-2 text-white" onClick={signIn}>
        Sign in
      </button>
    </div>
  );
}
