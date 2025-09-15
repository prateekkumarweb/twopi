<script setup lang="ts">
import { useAccountsQuery } from "@/lib/account";
import { useCategoryQuery } from "@/lib/category";
import { useTransactionsQuery } from "@/lib/transaction";

const route = useRoute();
const params = route.params as { id: string };

const query = useTransactionsQuery();
const { data: accounts } = useAccountsQuery();
const { data: categories } = useCategoryQuery();
const account = (id: string) => {
  return accounts.value?.accounts.find((a) => a.account.id === id);
};
const category = (id?: string | null) => {
  return categories.value?.categories.find((c) => c.id === id);
};
</script>

<template>
  <AppPage title="Edit transaction">
    <template #actions>
      <ULink :to="{ name: '/app/finance/transaction/' }" class="flex items-center gap-2">
        <UIcon name="i-lucide-arrow-left" /> All
      </ULink>
    </template>
    <QueryWrapper
      v-slot="{ data }"
      :data="query"
      :transform="
        (data) => {
          return data.transactions.find((t) => t.transaction.id === params.id);
        }
      "
    >
      <template v-if="data">
        <TransactionEditor
          :transaction="{
            id: data.transaction.id,
            title: data.transaction.title,
            timestamp: new Date(data.transaction.timestamp),
            items: data.items.map((item) => ({
              id: item.id,
              notes: item.notes,
              amount: item.amount,
              accountName: account(item.account_id)?.account.name ?? '',
              categoryName: category(item.category_id)?.name,
            })),
          }"
        />
      </template>
    </QueryWrapper>
  </AppPage>
</template>
