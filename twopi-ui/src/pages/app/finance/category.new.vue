<script setup lang="ts">
import { useCreateCategoryMutation } from "@/lib/category";
import type { FormSubmitEvent } from "@nuxt/ui";
import { useRouter } from "vue-router";
import z from "zod";

const router = useRouter();

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  group: z.string(),
  icon: z.string(),
});
type FormState = z.infer<typeof schema>;
const state = reactive<Partial<FormState>>({
  name: "",
  group: "",
  icon: "",
});

const { error, mutateAsync } = useCreateCategoryMutation();

async function createCategory(event: FormSubmitEvent<FormState>) {
  const done = await mutateAsync({
    name: event.data.name,
    group: event.data.group,
    icon: event.data.icon,
  });
  if (done.success) {
    router.push({
      name: "/app/finance/category",
    });
  }
}
</script>

<template>
  <AppPage title="New Category">
    <template #actions>
      <UButton
        variant="ghost"
        @click="
          () => {
            router.push({
              name: '/app/finance/category',
            });
          }
        "
      >
        <UIcon name="i-lucide-arrow-left" /> All
      </UButton>
    </template>
    <UForm :state="state" :schema="schema" class="space-y-4" @submit="createCategory">
      <UFormField label="Name" name="name">
        <UInput v-model="state.name" />
      </UFormField>
      <UFormField label="Group" name="group">
        <UInput v-model="state.group" />
      </UFormField>
      <UFormField label="Icon" name="icon">
        <UInput v-model="state.icon" />
      </UFormField>
      <UButton type="submit"> <UIcon name="i-lucide-plus" /> Create </UButton>
      <p v-if="error" class="text-error">{{ error?.message }}</p>
    </UForm>
  </AppPage>
</template>
