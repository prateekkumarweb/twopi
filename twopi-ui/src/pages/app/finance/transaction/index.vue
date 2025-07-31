<script setup lang="ts">
import { useTransactionsQuery } from "@/lib/transaction";

const { state } = useTransactionsQuery();
const router = useRouter();
</script>

<template>
  <AppPage title="Transaction">
    <template #actions>
      <UButton
        @click="
          () => {
            router.push({
              name: '/app/finance/transaction/new',
            });
          }
        "
      >
        <UIcon name="i-lucide-plus" /> Add
      </UButton>
    </template>
    <div v-if="state.status == 'pending'">
      <USkeleton class="h-32 w-full" />
    </div>
    <div v-else-if="state.status == 'error'" class="text-error">
      <p>Error loading transactions: {{ state.error?.message }}</p>
    </div>
    <div v-else class="space-y-4">
      <TransactionList :transactions="state.data.transactions" />
    </div>
  </AppPage>
</template>
