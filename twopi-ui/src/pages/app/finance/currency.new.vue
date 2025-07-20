<script setup lang="ts">
import { useCreateCurrencyMutation } from "@/lib/currency";
import type { FormSubmitEvent } from "@nuxt/ui";
import { useRouter } from "vue-router";
import z from "zod";

const router = useRouter();

const schema = z.object({
  code: z.string().length(3, "Code must be exactly 3 characters").min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  decimal_digits: z.number().int().min(0, "Decimal digits must be a non-negative integer"),
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
      name: "/app/finance/currency",
    });
  }
}
</script>

<template>
  <AppPage title="New Currency">
    <template #actions>
      <UButton
        variant="ghost"
        @click="
          () => {
            router.push({
              name: '/app/finance/currency',
            });
          }
        "
      >
        <UIcon name="i-lucide-arrow-left" /> All
      </UButton>
    </template>
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="createCurrency">
      <UFormField name="code" label="Code" :rules="{ required: true }">
        <UInput v-model="state.code" />
      </UFormField>
      <UFormField name="name" label="Name" :rules="{ required: true }">
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
