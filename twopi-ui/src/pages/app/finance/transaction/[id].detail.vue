<script setup lang="ts">
import { useAccountsQuery } from "@/lib/account";
import { useCategoryQuery } from "@/lib/category";
import { iconMap } from "@/lib/hacks/account-type";
import { useDeleteTransactionMutation, useTransactionsQuery } from "@/lib/transaction";
import dayjs from "dayjs";

const router = useRouter();
const route = useRoute();
const params = route.params as { id: string };

const { mutateAsync } = useDeleteTransactionMutation();

const query = useTransactionsQuery();
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
  <AppPage title="Transaction details">
    <template #actions>
      <ULink :to="{ name: '/app/finance/transaction/' }" class="flex items-center gap-2">
        <UIcon name="i-lucide-arrow-left" /> All
      </ULink>
      <UButton
        variant="outline"
        color="secondary"
        @click="
          () => {
            router.push({
              name: '/app/finance/transaction/[id].edit',
              params: { id: params.id },
            });
          }
        "
      >
        <UIcon name="i-lucide-edit" />
      </UButton>
      <UButton
        variant="outline"
        color="error"
        @click="
          async () => {
            await mutateAsync(params.id);
            router.push({ name: '/app/finance/transaction/' });
          }
        "
      >
        <UIcon name="i-lucide-trash" />
      </UButton>
    </template>
    <QueryWrapper
      v-slot="{ data }"
      :data="query"
      :transform="
        (data) => {
          return data.transactions.find((t) => t.transaction.id === params.id);
        }
      "
    >
      <template v-if="data">
        <LabelAndValue label="Id">{{ data.transaction.id }}</LabelAndValue>
        <LabelAndValue label="Title">{{ data.transaction.title }}</LabelAndValue>
        <LabelAndValue label="Timestamp">{{
          dayjs(data.transaction.timestamp).format("MMM D, YYYY h:mm A")
        }}</LabelAndValue>
        <div class="mt-2">
          <h2 class="text-lg font-bold">Transaction items</h2>
          <div class="my-2 flex flex-col gap-2">
            <UCard v-for="transactionItem in data.items" :key="transactionItem.id">
              <LabelAndValue label="Notes">{{ transactionItem.notes }}</LabelAndValue>
              <LocalScope v-slot="{ scope }" :scope="account(transactionItem.account_id)">
                <template v-if="scope">
                  <LabelAndValue label="Account">
                    <ULink
                      :to="{
                        name: '/app/finance/account/[id].detail',
                        params: { id: scope.account.id },
                      }"
                    >
                      <UBadge variant="outline" :icon="iconMap[scope.account.account_type]">{{
                        scope.account.name
                      }}</UBadge>
                    </ULink>
                  </LabelAndValue>
                  <LabelAndValue label="Amount">
                    <UBadge
                      :color="
                        transactionItem.amount < 0
                          ? 'error'
                          : transactionItem.amount > 0
                            ? 'success'
                            : 'neutral'
                      "
                    >
                      <CurrencyDisplay
                        :value="transactionItem.amount"
                        :currency-code="scope.account.currency_code"
                        :decimal-digits="scope.currency.decimal_digits"
                      />
                    </UBadge>
                  </LabelAndValue>
                </template>
              </LocalScope>
              <LocalScope v-slot="{ scope }" :scope="category(transactionItem.category_id)">
                <LabelAndValue v-if="scope" label="Category">
                  <ULink
                    :to="{
                      name: '/app/finance/category/[id].detail',
                      params: { id: scope.id },
                    }"
                  >
                    <UBadge variant="soft" :icon="scope.icon">{{ scope.name }}</UBadge>
                  </ULink>
                </LabelAndValue>
              </LocalScope>
            </UCard>
          </div>
        </div>
      </template>
      <template v-else>
        <p>Transaction not found</p>
      </template>
    </QueryWrapper>
  </AppPage>
</template>
