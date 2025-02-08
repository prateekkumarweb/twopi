import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.BASE_URL ?? "http://localhost:8000",
});

export const { signIn, signUp, useSession } = createAuthClient();
