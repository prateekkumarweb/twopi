<script setup lang="ts">
import { useAccountsQuery } from "@/lib/account";
import { useCategoryQuery } from "@/lib/category";
import { useCreateTransaactionMutation } from "@/lib/transaction";
import type { FormSubmitEvent } from "@nuxt/ui";
import dayjs from "dayjs";
import z from "zod";

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

const timestamp = new Date();
timestamp.setMilliseconds(0);
timestamp.setSeconds(0);

const { data: accounts } = useAccountsQuery();
const { data: categories } = useCategoryQuery();

const router = useRouter();
const itemSchema = z.object({
  id: z.string().optional(),
  notes: z.string(),
  accountName: z.string(),
  amount: z.number(),
  categoryName: z.string().optional(),
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
</script>

<template>
  <UForm :state="state" :schema="schema" class="space-y-4" @submit="createTransaction">
    <UFormField label="Title" name="title">
      <UInput v-model="state.title" />
    </UFormField>
    <UFormField label="Timestamp" name="timestamp">
      <UInput
        :model-value="dayjs(state.timestamp).format('YYYY-MM-DDTHH:mm')"
        type="datetime-local"
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
            <UInput v-model="item.notes" />
          </UFormField>
          <UFormField label="Account" name="accountName">
            <USelect
              v-model="item.accountName"
              :items="accounts?.accounts.map((a) => a.account.name)"
            />
          </UFormField>
          <UFormField label="Amount" name="amount">
            <UInputNumber
              v-model="item.amount"
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
            <USelect
              v-model="item.categoryName"
              :items="categories?.categories.map((c) => c.name)"
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
