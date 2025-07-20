<script setup lang="ts">
import CurrencyAction from "@/components/CurrencyAction.vue";
import { useCurrencyQuery, useSyncCurrencyMutation } from "@/lib/currency";
import type { TableColumn } from "@nuxt/ui";
import { useRouter } from "vue-router";

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
const router = useRouter();

const { mutate: syncCurrencies } = useSyncCurrencyMutation();
</script>

<template>
  <AppPage title="Currency">
    <template #actions>
      <UButton
        @click="
          () => {
            router.push({
              name: '/app/finance/currency.new',
            });
          }
        "
      >
        <UIcon name="i-lucide-plus" /> Add
      </UButton>
      <UButton variant="ghost" @click="() => syncCurrencies()">
        <UIcon name="i-lucide-refresh-cw" /> Sync
      </UButton>
    </template>
    <div v-if="state.status == 'pending'">
      <p>Loading...</p>
    </div>
    <div v-else-if="state.status == 'error' || state.data.error" class="text-error">
      <p>Error loading currencies: {{ state.data?.error ?? state.error?.message }}</p>
    </div>
    <div v-else class="flex-1 overflow-auto">
      <UTable :data="state.data.currency" :columns="columns" />
    </div>
  </AppPage>
</template>
