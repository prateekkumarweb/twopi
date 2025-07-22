<script setup lang="ts">
import { useDeleteCategoryMutation } from "@/lib/category";

defineProps<{
  id: string;
}>();

const { mutate } = useDeleteCategoryMutation();
</script>

<template>
  <UButton variant="outline" color="error" @click="() => mutate(id)">
    <UIcon name="i-lucide-trash" />
  </UButton>
</template>
