<script setup lang="ts">
import { useCategoryQuery } from "@/lib/category";
import { useTransactionsQuery } from "@/lib/transaction";

const { data: categoryies, state: categoriesState } = useCategoryQuery();
const { data: transactions } = useTransactionsQuery();
const route = useRoute();
const params = route.params as { id: string };

const category = computed(() => {
  return params.id ? categoryies.value?.categories.find((c) => c.id === params.id) : undefined;
});
const filteredTransactions = computed(
  () =>
    transactions.value?.transactions?.filter((transaction) =>
      transaction.items?.some((item) => item.category_id === params.id),
    ) ?? [],
);
</script>

<template>
  <AppPage title="Category details">
    <template #actions>
      <ULink :to="{ name: '/app/finance/category/' }" class="flex items-center gap-2">
        <UIcon name="i-lucide-arrow-left" /> All
      </ULink>
    </template>
    <div v-if="categoriesState.status === 'pending'">
      <p>Loading category...</p>
    </div>
    <div v-else-if="category">
      <LabelAndValue label="Id">{{ category.id }}</LabelAndValue>
      <LabelAndValue label="Name">{{ category.name }}</LabelAndValue>
      <LabelAndValue label="Group">{{ category.group }}</LabelAndValue>
      <LabelAndValue label="Icon">
        <UIcon :name="category.icon" class="text-xl" />
      </LabelAndValue>
      <div class="mt-2">
        <h2 class="text-lg font-bold">Transactions</h2>
        <TransactionList :transactions="filteredTransactions ?? []" />
      </div>
    </div>
  </AppPage>
</template>
