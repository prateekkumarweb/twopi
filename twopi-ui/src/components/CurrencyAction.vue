<script setup lang="ts">
import { useDeleteCurrencyMutation } from "@/lib/currency";

defineProps<{
  currencyCode: string;
}>();

const { mutate } = useDeleteCurrencyMutation();
</script>

<template>
  <UButton variant="outline" color="error" @click="() => mutate(currencyCode)">
    <UIcon name="i-lucide-trash" />
  </UButton>
</template>
