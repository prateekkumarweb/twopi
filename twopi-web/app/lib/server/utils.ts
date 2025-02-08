import { createMiddleware } from "@tanstack/start";
// import { auth } from "./auth";

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  // const headers = getWebRequest().headers;
  // const session = await auth.api.getSession({
  //   headers,
  // });
  // if (!session?.user) {
  //   throw new Error("Unauthorized");
  // }
  return await next({
    context: {
      userId: "dev",
    },
  });
});

export type User = {
  id: string;
  name: string;
  email: string;
};
