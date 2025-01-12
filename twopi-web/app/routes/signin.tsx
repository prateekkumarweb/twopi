import { useForm } from "@tanstack/react-form";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { useState } from "react";
import { z } from "zod";
import { authClient } from "~/lib/auth-client";

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
  const [signInError, setSignInError] = useState<string | undefined>();
  const [signUpError, setSignUpError] = useState<string | undefined>();
  const signInForm = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      const { error } = await authClient.signIn.email(value);
      if (error) {
        setSignInError(error.message);
      } else {
        await router.invalidate();
        if (search.redirect) {
          router.navigate({ to: search.redirect });
        } else {
          router.navigate({ to: "/" });
        }
      }
    },
  });
  const signUpForm = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      const { error } = await authClient.signUp.email(value);
      if (error) {
        setSignUpError(error.message);
      } else {
        await router.invalidate();
        if (search.redirect) {
          router.navigate({ to: search.redirect });
        } else {
          router.navigate({ to: "/" });
        }
      }
    },
  });

  if (state.session?.user) {
    return <div>You are already signed in</div>;
  }

  return (
    <div className="m-4 flex w-full gap-4">
      <div className="flex grow flex-col gap-4">
        <h1 className="text-xl font-bold">Sign in</h1>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            signInForm.handleSubmit();
          }}
        >
          <signInForm.Field
            name="email"
            // eslint-disable-next-line react/no-children-prop
            children={(field) => (
              <input
                type="email"
                placeholder="Email"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            )}
          />
          <signInForm.Field
            name="password"
            // eslint-disable-next-line react/no-children-prop
            children={(field) => (
              <input
                type="password"
                placeholder="Password"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            )}
          />
          <div className="text-red-600">{signInError}</div>
          <button type="submit" className="d-btn d-btn-primary">
            Sign in
          </button>
        </form>
      </div>
      <div className="flex grow flex-col gap-4">
        <h1 className="text-xl font-bold">Sign up</h1>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            signUpForm.handleSubmit();
          }}
        >
          <signUpForm.Field
            name="name"
            // eslint-disable-next-line react/no-children-prop
            children={(field) => (
              <input
                type="text"
                placeholder="Name"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            )}
          />
          <signUpForm.Field
            name="email"
            // eslint-disable-next-line react/no-children-prop
            children={(field) => (
              <input
                type="email"
                placeholder="Email"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            )}
          />
          <signUpForm.Field
            name="password"
            // eslint-disable-next-line react/no-children-prop
            children={(field) => (
              <input
                type="password"
                placeholder="Password"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            )}
          />
          <div className="text-red-600">{signUpError}</div>
          <button type="submit" className="d-btn d-btn-primary">
            Sign up
          </button>
        </form>
      </div>
    </div>
  );
}
