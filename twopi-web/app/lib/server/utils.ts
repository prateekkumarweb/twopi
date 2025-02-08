import { createMiddleware } from "@tanstack/start";
import { getWebRequest } from "@tanstack/start/server";

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const headers = getWebRequest()?.headers;
  const cookie = headers?.get("cookie");
  return await next({
    context: {
      cookie,
    },
  });
});
