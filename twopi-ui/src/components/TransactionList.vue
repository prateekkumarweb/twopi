<script setup lang="ts">
import type { Paths } from "@/lib/openapi";
import dayjs from "dayjs";

type Transaction = NonNullable<
  Paths["/twopi-api/transaction/{transaction_id}"]["get"]["responses"]["200"]["content"]["application/json"]
>;
const props = defineProps<{
  transactions: Readonly<Transaction[]>;
}>();

const transactions = computed(() =>
  Object.entries(
    Object.groupBy(props.transactions, (transaction) =>
      dayjs(transaction.transaction.timestamp).format("YYYY-MM-DD"),
    ),
  ).toSorted((a, b) => b[0].localeCompare(a[0])),
);
const noTransactions = computed(() => props.transactions.length === 0);
</script>

<template>
  <div class="my-2 flex flex-col gap-3">
    <div v-for="[date, txs] in transactions" :key="date" class="flex flex-col gap-2">
      <div class="font-light text-zinc-700">
        {{ dayjs(date).format("MMM D, YYYY") }}
      </div>
      <TransactionRow
        v-for="transaction in txs?.toSorted((a, b) =>
          b.transaction.timestamp.localeCompare(a.transaction.timestamp),
        )"
        :key="transaction.transaction.id"
        :transaction="transaction"
      />
    </div>
    <div v-if="noTransactions">No transactions found.</div>
  </div>
</template>
