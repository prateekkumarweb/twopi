<script setup lang="ts">
import { useAccountsQuery } from "@/lib/account";

const { data: accounts, state: accountsState } = useAccountsQuery();
const route = useRoute();
const params = route.params as { id: string };

const account = computed(() => {
  return params.id ? accounts.value?.accounts.find((c) => c.account.id === params.id) : undefined;
});
</script>

<template>
  <AppPage title="Edit account">
    <template #actions>
      <ULink :to="{ name: '/app/finance/account/' }" class="flex items-center gap-2">
        <UIcon name="i-lucide-arrow-left" /> All
      </ULink>
    </template>
    <div v-if="accountsState.status === 'pending'">
      <p>Loading account...</p>
    </div>
    <AccountEditor
      v-else-if="account"
      :account="{
        id: account.account.id,
        name: account.account.name,
        accountType: account.account.account_type,
        createdAt: new Date(account.account.created_at),
        currencyCode: account.account.currency_code,
        isActive: account.account.is_active,
        isCashFlow: account.account.is_cash_flow,
        startingBalance: account.account.starting_balance,
      }"
    />
  </AppPage>
</template>
