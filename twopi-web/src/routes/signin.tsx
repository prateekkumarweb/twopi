import { createForm } from "@tanstack/solid-form";
import { createFileRoute, useRouter } from "@tanstack/solid-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { createSignal, Show } from "solid-js";
import z from "zod";
import { Button } from "~/components/ui/button";
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
  const [signInError, setSignInError] = createSignal<string | undefined>();
  const [signUpError, setSignUpError] = createSignal<string | undefined>();
  const signInForm = createForm(() => ({
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
        if (search().next) {
          router.navigate({ to: search().next });
        } else {
          router.navigate({ to: "/" });
        }
      }
    },
  }));
  const signUpForm = createForm(() => ({
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
        if (search().next) {
          router.navigate({ to: search().next });
        } else {
          router.navigate({ to: "/" });
        }
      }
    },
  }));

  if (state().session?.user) {
    if (search().next) {
      router.navigate({ to: search().next });
    }
  }

  return (
    <Show
      when={!state().session?.user}
      fallback={<div>You are already signed in</div>}
    >
      <div class="flex w-full">
        <div class="m-4 flex grow flex-col gap-4">
          <h1 class="text-xl font-bold">Sign in</h1>
          <form
            class="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              signInForm.handleSubmit();
            }}
          >
            <signInForm.Field name="email">
              {(field) => (
                <input
                  type="email"
                  placeholder="Email"
                  name={field().name}
                  value={field().state.value}
                  onBlur={field().handleBlur}
                  onChange={(e) => field().handleChange(e.target.value)}
                  autocomplete="email"
                />
              )}
            </signInForm.Field>
            <signInForm.Field name="password">
              {(field) => (
                <input
                  type="password"
                  placeholder="Password"
                  name={field().name}
                  value={field().state.value}
                  onBlur={field().handleBlur}
                  onChange={(e) => field().handleChange(e.target.value)}
                  autocomplete="current-password"
                />
              )}
            </signInForm.Field>
            <div class="text-red-600">{signInError()}</div>
            <Button type="submit">Sign in</Button>
          </form>
        </div>
        <div class="m-4 flex grow flex-col gap-4">
          <h1 class="text-xl font-bold">Sign up</h1>
          <form
            class="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              signUpForm.handleSubmit();
            }}
          >
            <signUpForm.Field name="name">
              {(field) => (
                <input
                  type="text"
                  placeholder="Name"
                  name={field().name}
                  value={field().state.value}
                  onBlur={field().handleBlur}
                  onChange={(e) => field().handleChange(e.target.value)}
                />
              )}
            </signUpForm.Field>
            <signUpForm.Field name="email">
              {(field) => (
                <input
                  type="email"
                  placeholder="Email"
                  name={field().name}
                  value={field().state.value}
                  onBlur={field().handleBlur}
                  onChange={(e) => field().handleChange(e.target.value)}
                  autocomplete="email"
                />
              )}
            </signUpForm.Field>
            <signUpForm.Field name="password">
              {(field) => (
                <input
                  type="password"
                  placeholder="Password"
                  name={field().name}
                  value={field().state.value}
                  onBlur={field().handleBlur}
                  onChange={(e) => field().handleChange(e.target.value)}
                  autocomplete="new-password"
                />
              )}
            </signUpForm.Field>
            <div class="text-red-600">{signUpError()}</div>
            <Button type="submit">Sign up</Button>
          </form>
        </div>
      </div>
    </Show>
  );
}
