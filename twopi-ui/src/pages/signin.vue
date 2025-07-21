<script setup lang="ts">
import { useAuthUser, useSignIn, useSignUp } from "@/lib/auth";
import type { FormSubmitEvent } from "@nuxt/ui";
import { useRoute, useRouter } from "vue-router";
import z from "zod";

const route = useRoute();
const router = useRouter();

const signInSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});
type SignInForm = z.infer<typeof signInSchema>;

const signUpSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});
type SignUpForm = z.infer<typeof signUpSchema>;

const signInState = reactive<Partial<SignInForm>>({
  email: "",
  password: "",
});

const signUpState = reactive<Partial<SignUpForm>>({
  name: "",
  email: "",
  password: "",
});

const { mutate: signIn, error: signInError } = useSignIn();
const { mutate: signUp, error: signUpError } = useSignUp();

function onSignIn(event: FormSubmitEvent<SignInForm>) {
  signIn({
    email: event.data.email,
    password: event.data.password,
  });
}

function onSignUp(event: FormSubmitEvent<SignUpForm>) {
  signUp({
    name: event.data.name,
    email: event.data.email,
    password: event.data.password,
  });
}

const { data: session } = useAuthUser();
const user = computed(() => session.value?.user);

watchEffect(() => {
  if (user.value) {
    if (route.query.next) {
      router.push(route.query.next as string);
    } else {
      router.push({
        name: "/app",
      });
    }
  }
});
</script>

<template>
  <div v-if="user">
    <div>You are already signed in.</div>
  </div>
  <div v-else class="flex gap-4 p-4">
    <div class="flex-1">
      <h2 class="mb-4 text-2xl font-bold">Sign In</h2>
      <UForm :schema="signInSchema" :state="signInState" class="space-y-4" @submit="onSignIn">
        <UFormField label="Email" name="email">
          <UInput v-model="signInState.email" />
        </UFormField>

        <UFormField label="Password" name="password">
          <UInput v-model="signInState.password" type="password" />
        </UFormField>

        <UButton type="submit"> Submit </UButton>

        <p v-if="signInError" class="text-red-600">{{ signInError }}</p>
      </UForm>
    </div>
    <div class="flex-1">
      <h2 class="mb-4 text-2xl font-bold">Sign Up</h2>
      <UForm :schema="signUpSchema" :state="signUpState" class="space-y-4" @submit="onSignUp">
        <UFormField label="Name" name="name">
          <UInput v-model="signUpState.name" />
        </UFormField>

        <UFormField label="Email" name="email">
          <UInput v-model="signUpState.email" />
        </UFormField>

        <UFormField label="Password" name="password">
          <UInput v-model="signUpState.password" type="password" />
        </UFormField>

        <UButton type="submit"> Submit </UButton>

        <p v-if="signUpError" class="text-red-600">{{ signUpError }}</p>
      </UForm>
    </div>
  </div>
</template>
