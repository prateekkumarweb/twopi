<script setup lang="ts">
import { useCreateCategoryMutation } from "@/lib/category";
import type { FormSubmitEvent } from "@nuxt/ui";
import z from "zod";

const props = defineProps<{
  category?: {
    id: string;
    name: string;
    group: string;
    icon: string;
  };
}>();

const router = useRouter();

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  group: z.string(),
  icon: z.string(),
});
type FormState = z.infer<typeof schema>;
const state = reactive<FormState>({
  name: props.category?.name || "",
  group: props.category?.group || "",
  icon: props.category?.icon || "",
});

const { error, mutateAsync } = useCreateCategoryMutation();

async function createCategory(event: FormSubmitEvent<FormState>) {
  const done = await mutateAsync({
    id: props.category?.id,
    name: event.data.name,
    group: event.data.group,
    icon: event.data.icon,
  });
  if (done.success) {
    router.push({
      name: "/app/finance/category/",
    });
  }
}
</script>

<template>
  <UForm :state="state" :schema="schema" class="space-y-4" @submit="createCategory">
    <UFormField label="Name" name="name">
      <UInput v-model="state.name" />
    </UFormField>
    <UFormField label="Group" name="group">
      <UInput v-model="state.group" />
    </UFormField>
    <UFormField label="Icon" name="icon">
      <UInput v-model="state.icon" :trailing-icon="state.icon" />
    </UFormField>
    <UButton v-if="category" type="submit"> <UIcon name="i-lucide-save" /> Save </UButton>
    <UButton v-else type="submit"> <UIcon name="i-lucide-plus" /> Create </UButton>
    <p v-if="error" class="text-error">{{ error?.message }}</p>
  </UForm>
</template>
