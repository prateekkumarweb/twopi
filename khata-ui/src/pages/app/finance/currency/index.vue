<script setup lang="ts">
import {
  useCurrencyQuery,
  useDeleteCurrencyMutation,
  useSyncCurrencyMutation,
} from "@/lib/currency";

const query = useCurrencyQuery();
const router = useRouter();

const { mutate: syncCurrencies } = useSyncCurrencyMutation();
const { mutate } = useDeleteCurrencyMutation();
</script>

<template>
  <AppPage title="Currency">
    <template #actions>
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
      <UCard v-for="item in currency" :key="item.code">
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
