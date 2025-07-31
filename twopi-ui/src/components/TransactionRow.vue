<script setup lang="ts">
import { useAccountsQuery } from "@/lib/account";
import { useCategoryQuery } from "@/lib/category";
import { iconMap } from "@/lib/hacks/account-type";
import type { Paths } from "@/lib/openapi";
import dayjs from "dayjs";

type Transaction = NonNullable<
  Paths["/twopi-api/transaction/{transaction_id}"]["get"]["responses"]["200"]["content"]["application/json"]
>;

const props = defineProps<{
  transaction: Readonly<Transaction>;
}>();

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
  <UCard>
    <ULink
      :to="{
        name: '/app/finance/transaction/[id].detail',
        params: {
          id: props.transaction.transaction.id,
        },
      }"
      class="flex flex-col gap-2"
    >
      <div class="flex gap-2">
        <h2 class="grow overflow-hidden text-ellipsis text-nowrap">
          {{ props.transaction.transaction.title }}
        </h2>
        <div class="flex gap-2 text-sm">
          {{ dayjs(props.transaction.transaction.timestamp).format("h:mm A") }}
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <div v-for="item in props.transaction.items" :key="item.id" class="flex items-center gap-2">
          <div class="grow overflow-hidden text-ellipsis text-nowrap text-sm">
            <LocalScope v-slot="{ scope }" :scope="category(item.category_id)">
              <UBadge v-if="scope" variant="soft" class="text-nowrap" :icon="scope.icon">{{
                scope.name
              }}</UBadge>
            </LocalScope>
            {{ item.notes }}
          </div>
          <LocalScope v-slot="{ scope }" :scope="account(item.account_id)">
            <UBadge
              v-if="scope"
              variant="outline"
              :icon="iconMap[scope.account.account_type]"
              class="text-nowrap"
              >{{ scope.account.name }}</UBadge
            >
            <UBadge
              v-if="scope"
              class="text-nowrap"
              :color="item.amount < 0 ? 'error' : item.amount > 0 ? 'success' : 'neutral'"
            >
              <CurrencyDisplay
                :value="item.amount"
                :currency-code="scope.currency.code"
                :decimal-digits="scope.currency.decimal_digits"
              />
            </UBadge>
          </LocalScope>
        </div>
      </div>
    </ULink>
  </UCard>
</template>
;
