<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import { onMounted, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import { apiClient } from "@/lib/openapi";
import { ref } from "vue";

const route = useRoute();
const router = useRouter();
const signInError = ref<string | undefined>();
const signUpError = ref<string | undefined>();

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

async function onSignIn(event: FormSubmitEvent<SignInForm>) {
  const { error } = await apiClient.POST("/twopi-api/api/signin", {
    body: {
      email: event.data.email,
      password: event.data.password,
    },
  });
  if (error) {
    signInError.value = error;
  } else {
    signInError.value = undefined;
    if (route.query.next) {
      router.push(route.query.next as string);
    } else {
      router.push("/");
    }
  }
}

async function onSignUp(event: FormSubmitEvent<SignUpForm>) {
  const { error } = await apiClient.POST("/twopi-api/api/signup", {
    body: {
      name: event.data.name,
      email: event.data.email,
      password: event.data.password,
    },
  });
  if (error) {
    signUpError.value = error;
  } else {
    signUpError.value = undefined;
    if (route.query.next) {
      router.push(route.query.next as string);
    } else {
      router.push("/");
    }
  }
}

const user = ref();

onMounted(async () => {
  const { data, error, response } = await apiClient.GET("/twopi-api/api/user");
  if (response.status === 500) {
    console.error(response.statusText, response);
    throw new Error("Internal Server Error");
  }
  if (error) {
    console.error("Auth Error", error);
  }
  if (data) {
    user.value = data ? { user: data } : undefined;
    if (route.query.next) {
      router.push(route.query.next as string);
    } else {
      router.push("/");
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
      </UForm>
    </div>
  </div>
</template>
