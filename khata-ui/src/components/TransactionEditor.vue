<script setup lang="ts">
import { useAccountsQuery } from "@/lib/account";
import { useCategoryQuery } from "@/lib/category";
import type { Paths } from "@/lib/openapi";
import { useCreateTransaactionMutation, useTransactionsQuery } from "@/lib/transaction";
import type { FormSubmitEvent } from "@nuxt/ui";
import dayjs from "dayjs";
import * as z from "zod/mini";

const props = defineProps<{
  transaction?: {
    id: string;
    title: string;
    timestamp: Date;
    items: {
      id: string;
      notes: string;
      accountName: string;
      amount: number;
      categoryName?: string;
    }[];
  };
}>();

const autoCompleteOpen = ref(false);

const timestamp = new Date();
timestamp.setMilliseconds(0);
timestamp.setSeconds(0);

const { data: accounts } = useAccountsQuery();
const { data: categories } = useCategoryQuery();
const { data: allTransactions } = useTransactionsQuery();

const router = useRouter();
const itemSchema = z.object({
  id: z.optional(z.string()),
  notes: z.string(),
  accountName: z.string(),
  amount: z.number(),
  categoryName: z.optional(z.string()),
});
const schema = z.object({
  title: z.string(),
  timestamp: z.date(),
  items: z.array(itemSchema),
});
type FormState = z.infer<typeof schema>;

const state = reactive<FormState>({
  title: props.transaction?.title || "",
  timestamp: props.transaction?.timestamp || timestamp,
  items: props.transaction?.items || [],
});

const { error, mutateAsync } = useCreateTransaactionMutation();

async function createTransaction(event: FormSubmitEvent<FormState>) {
  const done = await mutateAsync({
    id: props.transaction?.id,
    title: event.data.title,
    timestamp: event.data.timestamp,
    transactions: event.data.items.map((item) => ({
      ...item,
      categoryName: item.categoryName === "" ? undefined : item.categoryName,
    })),
  });
  if (done.success) {
    router.push({
      name: "/app/finance/transaction/",
    });
  }
}

const matchingTransactions = computed(() => {
  if (!state.title) return [];
  return allTransactions?.value?.transactions.filter((transaction) =>
    transaction.transaction.title.toLowerCase().includes(state.title.toLowerCase()),
  );
});

type Transaction =
  Paths["/khata-api/transaction"]["get"]["responses"]["200"]["content"]["application/json"][number];

function selectTransaction(t: Transaction) {
  state.title = t.transaction.title;
  state.items = t.items.map((item) => ({
    notes: item.notes || "",
    accountName:
      accounts.value?.accounts.find((a) => a.account.id === item.account_id)?.account.name ?? "",
    amount: item.amount,
    categoryName: categories.value?.categories.find((c) => c.id === item.category_id)?.name,
  }));
  console.log("Selected transaction:", state);
}
</script>

<template>
  <UForm :state="state" :schema="schema" class="space-y-4" @submit="createTransaction">
    <UFormField label="Title" name="title">
      <UPopover
        :open="autoCompleteOpen && Boolean(matchingTransactions?.length)"
        :dismissible="false"
        :ui="{ content: 'w-(--reka-popper-anchor-width) p-2' }"
      >
        <template #anchor>
          <UInput
            v-model="state.title"
            class="w-full"
            @focus="autoCompleteOpen = true"
            @blur="autoCompleteOpen = false"
          />
        </template>
        <template #content>
          <div class="flex max-h-64 flex-col gap-1 overflow-auto">
            <div
              v-for="t in matchingTransactions"
              :key="t.transaction.id"
              class="hover:bg-accented cursor-pointer rounded-lg p-2"
              @click="
                selectTransaction(t);
                autoCompleteOpen = false;
              "
            >
              {{ t.transaction.title }}
            </div>
          </div>
        </template>
      </UPopover>
    </UFormField>
    <UFormField label="Timestamp" name="timestamp">
      <UInput
        :model-value="dayjs(state.timestamp).format('YYYY-MM-DDTHH:mm')"
        type="datetime-local"
        class="w-full"
        @update:model-value="($event) => (state.timestamp = dayjs($event).toDate())"
      />
    </UFormField>
    <div class="my-2 space-y-4">
      <h2 class="text-lg">Transactions:</h2>
      <UForm
        v-for="(item, index) in state.items"
        :key="index"
        :state="item"
        :schema="itemSchema"
        attach
      >
        <UCard>
          <UFormField label="Notes" name="notes">
            <UInput v-model="item.notes" class="w-full" />
          </UFormField>
          <UFormField label="Account" name="accountName">
            <USelectMenu
              v-model="item.accountName"
              :items="accounts?.accounts.map((a) => a.account.name)"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Amount" name="amount">
            <UInputNumber
              v-model="item.amount"
              class="w-full"
              :format-options="{
                style: 'currency',
                currency:
                  accounts?.accounts.find((a) => a.account.name === item.accountName)?.account
                    .currency_code || 'USD',
                currencyDisplay: 'code',
                currencySign: 'standard',
              }"
            />
          </UFormField>
          <UFormField label="Category" name="categoryName">
            <USelectMenu
              v-model="item.categoryName"
              :items="categories?.categories.map((c) => c.name)"
              class="w-full"
            />
          </UFormField>
          <UButton type="button" color="error" class="mt-2" @click="state.items.splice(index, 1)">
            <UIcon name="i-lucide-trash" />
          </UButton>
        </UCard>
      </UForm>
      <UButton
        type="button"
        variant="outline"
        @click="state.items.push({ notes: '', accountName: '', amount: 0, categoryName: '' })"
      >
        Add transaction
      </UButton>
    </div>
    <UButton v-if="transaction" type="submit"> <UIcon name="i-lucide-save" /> Save </UButton>
    <UButton v-else type="submit"> <UIcon name="i-lucide-plus" /> Create </UButton>
    <p v-if="error" class="text-error">{{ error?.message }}</p>
  </UForm>
</template>
