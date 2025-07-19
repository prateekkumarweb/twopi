<script setup lang="ts">
import CurrencyAction from "@/components/CurrencyAction.vue";
import { useCurrencyQuery, useSyncCurrencyMutation } from "@/lib/currency";
import type { TableColumn } from "@nuxt/ui";
import { h } from "vue";

type Currency = {
  code: string;
  name: string;
  decimal_digits: number;
};

const columns: TableColumn<Currency>[] = [
  {
    accessorKey: "code",
    header: "Code",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "decimal_digits",
    header: "Decimal Digits",
  },
  {
    header: "Actions",
    cell: ({ row }) => {
      return h(CurrencyAction, {
        currencyCode: row.original.code,
      });
    },
  },
];

const { state } = useCurrencyQuery();

const { mutate: syncCurrencies } = useSyncCurrencyMutation();
</script>

<template>
  <div class="flex h-full flex-col gap-4">
    <div class="flex">
      <h2 class="flex-1 text-xl font-semibold">Currency</h2>
      <UButton variant="ghost" @click="() => syncCurrencies()">
        Sync <UIcon name="i-lucide-refresh-cw" />
      </UButton>
    </div>
    <div v-if="state.status == 'pending'">
      <p>Loading...</p>
    </div>
    <div v-else-if="state.status == 'error' || state.data.error" class="text-red-500">
      <p>Error loading currencies: {{ state.data?.error ?? state.error?.message }}</p>
    </div>
    <div v-else class="flex-1 overflow-auto">
      <UTable :data="state.data.currency" :columns="columns" />
    </div>
  </div>
</template>
