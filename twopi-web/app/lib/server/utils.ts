import { createMiddleware } from "@tanstack/start";
import { getWebRequest } from "vinxi/http";
import { auth } from "./auth";

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const headers = getWebRequest().headers;
  const session = await auth.api.getSession({
    headers,
  });
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return await next({
    context: {
      userId: session.user.id,
    },
  });
});
