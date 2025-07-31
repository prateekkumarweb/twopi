<script setup lang="ts">
import { useAccountsQuery } from "@/lib/account";
import { useDeleteCategoryMutation } from "@/lib/category";
import { iconMap } from "@/lib/hacks/account-type";
import type { Paths } from "@/lib/openapi";
import { useTransactionsQuery } from "@/lib/transaction";
import dayjs from "dayjs";

const { mutate } = useDeleteCategoryMutation();
const { data: transactions } = useTransactionsQuery();

const { state, data: accounts } = useAccountsQuery();
const router = useRouter();

type Account = NonNullable<
  Paths["/twopi-api/account/{account_id}"]["get"]["responses"]["200"]["content"]["application/json"]
>;

const filteredTransactions = computed(() => {
  if (!transactions.value?.transactions || !accounts.value?.accounts) {
    return [];
  }
  return transactions.value.transactions?.filter((transaction) => {
    return (
      transaction.items?.some((item) =>
        accounts.value?.accounts.some((account) => account.account.id === item.account_id),
      ) ?? false
    );
  });
});

function calculateBalance(account: Account) {
  return (
    account.account.starting_balance +
    (filteredTransactions.value
      ?.map((transaction) => {
        let amount = 0;
        for (const item of transaction.items) {
          if (item.account_id === account.account.id) {
            amount += item.amount;
          }
        }
        return amount;
      })
      .reduce((acc, curr) => acc + curr, 0) ?? 0)
  );
}
</script>

<template>
  <AppPage title="Account">
    <template #actions>
      <UButton
        @click="
          () => {
            router.push({ name: '/app/finance/account/new' });
          }
        "
      >
        <UIcon name="i-lucide-plus" /> Add
      </UButton>
    </template>
    <div v-if="state.status == 'pending'">
      <USkeleton class="h-32 w-full" />
    </div>
    <div v-else-if="state.status == 'error'" class="text-error">
      <p>Error loading accounts: {{ state.error?.message }}</p>
    </div>
    <div v-else class="space-y-4">
      <UCard v-for="item in state.data.accounts" :key="item.account.id">
        <div class="flex">
          <div>{{ item.account.name }}</div>
          <UBadge class="mx-2" :icon="iconMap[item.account.account_type]">{{
            item.account.account_type
          }}</UBadge>
          <div class="flex-1"></div>
          <div class="flex space-x-2">
            <UButton
              variant="outline"
              color="primary"
              @click="
                () => {
                  router.push({
                    name: '/app/finance/account/[id].detail',
                    params: { id: item.account.id },
                  });
                }
              "
            >
              <UIcon name="i-lucide-eye" />
            </UButton>
            <UButton
              variant="outline"
              color="secondary"
              @click="
                () => {
                  router.push({
                    name: '/app/finance/account/[id].edit',
                    params: { id: item.account.id },
                  });
                }
              "
            >
              <UIcon name="i-lucide-edit" />
            </UButton>
            <UButton variant="outline" color="error" @click="() => mutate(item.account.id)">
              <UIcon name="i-lucide-trash" />
            </UButton>
          </div>
        </div>
        <div class="mt-2 flex gap-2">
          <UBadge variant="outline">
            <CurrencyDisplay
              :value="calculateBalance(item)"
              :currency-code="item.currency.code"
              :decimal-digits="item.currency.decimal_digits"
            />
          </UBadge>
          <UBadge v-if="item.account.is_active" variant="soft" color="success">Active</UBadge>
          <UBadge v-if="item.account.is_cash_flow" variant="soft" color="neutral">Cash flow</UBadge>
          <div class="flex-1"></div>
          <UBadge variant="soft">
            {{ dayjs(item.account.created_at).format("D MMM YYYY") }}
          </UBadge>
        </div>
      </UCard>
    </div>
  </AppPage>
</template>
