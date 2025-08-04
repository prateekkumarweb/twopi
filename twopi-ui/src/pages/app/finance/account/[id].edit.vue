<script setup lang="ts">
import { useAccountsQuery } from "@/lib/account";

const query = useAccountsQuery();
const route = useRoute();
const params = route.params as { id: string };
</script>

<template>
  <AppPage title="Edit account">
    <template #actions>
      <ULink :to="{ name: '/app/finance/account/' }" class="flex items-center gap-2">
        <UIcon name="i-lucide-arrow-left" /> All
      </ULink>
    </template>
    <QueryWrapper
      v-slot="{ data: account }"
      :data="query"
      :transform="(data) => data.accounts?.find((c) => c.account.id === params.id)"
    >
      <AccountEditor
        v-if="account"
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
    </QueryWrapper>
  </AppPage>
</template>
