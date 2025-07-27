<script setup lang="ts">
import { useAccountsQuery } from "@/lib/account";
import dayjs from "dayjs";

const { data: accounts, state: accountsState } = useAccountsQuery();
const route = useRoute();
const params = route.params as { id: string };

const account = computed(() => {
  return params.id ? accounts.value?.accounts.find((c) => c.account.id === params.id) : undefined;
});
</script>

<template>
  <AppPage title="Account Details">
    <template #actions>
      <ULink :to="{ name: '/app/finance/account/' }" class="flex items-center gap-2">
        <UIcon name="i-lucide-arrow-left" /> All
      </ULink>
    </template>
    <div v-if="accountsState.status === 'pending'">
      <p>Loading category...</p>
    </div>
    <div v-else-if="account">
      <LabelAndValue label="Id">{{ account.account.id }}</LabelAndValue>
      <LabelAndValue label="Name">{{ account.account.name }}</LabelAndValue>
      <LabelAndValue label="Account type">{{ account.account.account_extra }}</LabelAndValue>
      <LabelAndValue label="Created at">
        {{ dayjs(account.account.created_at).format("MMM D, YYYY h:mm A") }}
      </LabelAndValue>
      <LabelAndValue label="Currency">{{ account.currency.code }}</LabelAndValue>
      <LabelAndValue label="Starting balance">
        <UBadge
          :color="
            account.account.starting_balance < 0
              ? 'error'
              : account.account.starting_balance > 0
                ? 'success'
                : 'neutral'
          "
        >
          <CurrencyDisplay
            :value="account.account.starting_balance"
            :currency-code="account.currency.code"
            :decimal-digits="account.currency.decimal_digits"
          />
        </UBadge>
      </LabelAndValue>
      <LabelAndValue label="Cash flow">{{
        account.account.is_cash_flow ? "Yes" : "No"
      }}</LabelAndValue>
      <LabelAndValue label="Active">{{ account.account.is_active ? "Yes" : "No" }}</LabelAndValue>
    </div>
  </AppPage>
</template>
