<script setup lang="ts">
import { useCurrencyQuery } from "@/lib/currency";
import type { TableColumn } from "@nuxt/ui";

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
];

const { data: currencies, error } = useCurrencyQuery();
</script>

<template>
  <div class="flex h-full flex-col gap-4">
    <h2 class="text-xl font-semibold">Currency</h2>
    <div v-if="error" class="text-red-500">
      <p>Error loading currencies: {{ error.message }}</p>
    </div>
    <div v-else class="flex-1 overflow-auto">
      <UTable :data="currencies?.currency" :columns="columns" />
    </div>
  </div>
</template>
