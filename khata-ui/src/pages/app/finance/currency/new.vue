<script setup lang="ts">
import { useCreateCurrencyMutation } from "@/lib/currency";
import type { FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod/mini";

const router = useRouter();

const schema = z.object({
  code: z.string().check(z.length(3, "Code must be exactly 3 characters")),
  name: z.string().check(z.minLength(1, "Name is required")),
  decimal_digits: z
    .number()
    .check(z.int())
    .check(z.minimum(0, "Decimal digits must be a non-negative integer")),
});
type FormState = z.infer<typeof schema>;
const state = reactive<Partial<FormState>>({
  code: "",
  name: "",
  decimal_digits: 0,
});

const { error, mutateAsync } = useCreateCurrencyMutation();

async function createCurrency(event: FormSubmitEvent<FormState>) {
  const done = await mutateAsync({
    code: event.data.code,
    name: event.data.name,
    decimal_digits: event.data.decimal_digits,
  });
  if (done.success) {
    router.push({
      name: "/app/finance/currency/",
    });
  }
}
</script>

<template>
  <AppPage title="New currency">
    <template #actions>
      <ULink :to="{ name: '/app/finance/currency/' }" class="flex items-center gap-2">
        <UIcon name="i-lucide-arrow-left" /> All
      </ULink>
    </template>
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="createCurrency">
      <UFormField name="code" label="Code">
        <UInput v-model="state.code" />
      </UFormField>
      <UFormField name="name" label="Name">
        <UInput v-model="state.name" />
      </UFormField>
      <UFormField name="decimal_digits" label="Decimal Digits">
        <UInput v-model.number="state.decimal_digits" type="number" />
      </UFormField>
      <UButton type="submit"> <UIcon name="i-lucide-check" /> Save </UButton>
      <p v-if="error" class="text-error">{{ error?.message }}</p>
    </UForm>
  </AppPage>
</template>
