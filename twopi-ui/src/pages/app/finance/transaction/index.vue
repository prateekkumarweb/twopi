<script setup lang="ts">
import { useTransactionsQuery } from "@/lib/transaction";

const query = useTransactionsQuery();
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
    <QueryWrapper v-slot="{ data }" :data="query" :transform="(data) => data.transactions">
      <div class="space-y-4">
        <TransactionList :transactions="data" />
      </div>
    </QueryWrapper>
  </AppPage>
</template>
