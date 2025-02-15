import { useForm } from "@tanstack/react-form";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { useState } from "react";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { apiClient } from "~/lib/openapi";

const signinSearchParamsSchema = z.object({
  next: z.string().optional(),
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
      const { error } = await apiClient.POST("/twopi-api/api/signin", {
        body: {
          email: value.email,
          password: value.password,
        },
      });
      if (error) {
        setSignInError(error);
      } else {
        await router.invalidate();
        if (search.next) {
          router.navigate({ to: search.next });
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
      const { error } = await apiClient.POST("/twopi-api/api/signup", {
        body: {
          name: value.name,
          email: value.email,
          password: value.password,
        },
      });
      if (error) {
        setSignUpError(error);
      } else {
        await router.invalidate();
        if (search.next) {
          router.navigate({ to: search.next });
        } else {
          router.navigate({ to: "/" });
        }
      }
    },
  });

  if (state.session?.user) {
    if (search.next) {
      router.navigate({ to: search.next });
    }
    return <div>You are already signed in</div>;
  }

  return (
    <div className="flex w-full">
      <div className="m-4 flex grow flex-col gap-4">
        <h1 className="text-xl font-bold">Sign in</h1>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            signInForm.handleSubmit();
          }}
        >
          <signInForm.Field name="email">
            {(field) => (
              <Input
                type="email"
                placeholder="Email"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                autoComplete="email"
              />
            )}
          </signInForm.Field>
          <signInForm.Field name="password">
            {(field) => (
              <Input
                type="password"
                placeholder="Password"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                autoComplete="current-password"
              />
            )}
          </signInForm.Field>
          <div className="text-red-600">{signInError}</div>
          <Button type="submit" variant="default">
            Sign in
          </Button>
        </form>
      </div>
      <div className="m-4 flex grow flex-col gap-4">
        <h1 className="text-xl font-bold">Sign up</h1>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            signUpForm.handleSubmit();
          }}
        >
          <signUpForm.Field name="name">
            {(field) => (
              <Input
                type="text"
                placeholder="Name"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            )}
          </signUpForm.Field>
          <signUpForm.Field name="email">
            {(field) => (
              <Input
                type="email"
                placeholder="Email"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                autoComplete="email"
              />
            )}
          </signUpForm.Field>
          <signUpForm.Field name="password">
            {(field) => (
              <Input
                type="password"
                placeholder="Password"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                autoComplete="new-password"
              />
            )}
          </signUpForm.Field>
          <div className="text-red-600">{signUpError}</div>
          <Button type="submit" variant="default">
            Sign up
          </Button>
        </form>
      </div>
    </div>
  );
}
