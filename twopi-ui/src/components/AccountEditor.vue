<script setup lang="ts">
import type { AccountTypeOrigin } from "@/lib/hacks/account-type";

defineProps<{
  account?: {
    id: string;
    name: string;
    accountType: AccountTypeOrigin;
    createdAt: Date;
    currencyCode: string;
    startingBalance: number;
    isCashFlow: boolean;
    isActive: boolean;
  };
}>();
</script>

<template>
  <UFrom></UFrom>
</template>
