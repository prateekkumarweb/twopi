<script setup lang="ts">
import { useDeleteCategoryMutation } from "@/lib/category";

defineProps<{
  id: string;
}>();

const { mutate } = useDeleteCategoryMutation();
const router = useRouter();
</script>

<template>
  <div class="flex space-x-2">
    <UButton
      variant="outline"
      color="primary"
      @click="
        () => {
          router.push({ name: '/app/finance/category.[id].detail', params: { id } });
        }
      "
    >
      <UIcon name="i-lucide-eye" />
    </UButton>
    <UButton
      variant="outline"
      color="secondary"
      @click="
        () => {
          router.push({ name: '/app/finance/category.[id].edit', params: { id } });
        }
      "
    >
      <UIcon name="i-lucide-edit" />
    </UButton>
    <UButton variant="outline" color="error" @click="() => mutate(id)">
      <UIcon name="i-lucide-trash" />
    </UButton>
  </div>
</template>
