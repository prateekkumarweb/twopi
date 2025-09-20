<script setup lang="ts">
import {
  useCurrencyQuery,
  useDeleteCurrencyMutation,
  useSyncCurrencyMutation,
} from "@/lib/currency";
import type { Paths } from "@/lib/openapi";

type Currency = NonNullable<
  Paths["/khata-api/currency"]["get"]["responses"]["200"]["content"]["application/json"]
>[number];

const query = useCurrencyQuery();
const router = useRouter();
const searchTerm = ref("");

const { mutate: syncCurrencies } = useSyncCurrencyMutation();
const { mutate } = useDeleteCurrencyMutation();

function filterCurrencies(currencies: Currency[], searchTerm: string) {
  if (!searchTerm) {
    return currencies;
  }
  const search = searchTerm.toLowerCase();
  return currencies.filter(
    (currency) =>
      currency.name.toLowerCase().includes(search) || currency.code.toLowerCase().includes(search),
  );
}
</script>

<template>
  <AppPage title="Currency">
    <template #actions>
      <UInput
        v-model="searchTerm"
        class="mr-2"
        placeholder="Search currencies..."
        icon="i-lucide-search"
      />
      <UButton
        @click="
          () => {
            router.push({
              name: '/app/finance/currency/new',
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
    <QueryWrapper
      v-slot="{ data: currency }"
      :data="query"
      :transform="(data) => data.currency"
      class="space-y-4"
    >
      <UCard v-for="item in filterCurrencies(currency, searchTerm)" :key="item.code">
        <div class="flex gap-2">
          <div class="flex-1 overflow-hidden text-ellipsis text-nowrap">{{ item.name }}</div>
          <UBadge class="text-nowrap" variant="outline" color="neutral">
            {{ item.decimal_digits }} digits
          </UBadge>
          <UBadge>{{ item.code }}</UBadge>
          <UButton variant="outline" color="error" @click="() => mutate(item.code)">
            <UIcon name="i-lucide-trash" />
          </UButton>
        </div>
      </UCard>
    </QueryWrapper>
  </AppPage>
</template>
