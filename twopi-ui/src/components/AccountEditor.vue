<script setup lang="ts">
import { useCreateAccountMutation } from "@/lib/account";
import { useCurrencyQuery } from "@/lib/currency";
import { AccountType, type AccountTypeOrigin } from "@/lib/hacks/account-type";
import type { FormSubmitEvent } from "@nuxt/ui";
import dayjs from "dayjs";
import * as z from "zod/mini";

const props = defineProps<{
  account?: {
    id: string;
    name: string;
    accountType: AccountTypeOrigin;
    createdAt: Date;
    currencyCode: string;
    startingBalance: number;
    isCashFlow: boolean;
    isActive: boolean;
  };
}>();

const router = useRouter();
const { data: currencies } = useCurrencyQuery();

const createdAt = new Date();
createdAt.setMilliseconds(0);
createdAt.setSeconds(0);

const schema = z.object({
  name: z.string().check(z.minLength(1, "Name is required")),
  accountType: z.enum(AccountType),
  createdAt: z.date(),
  currencyCode: z.string().check(z.minLength(1, "Currency code is required")),
  startingBalance: z.number(),
  isCashFlow: z.boolean(),
  isActive: z.boolean(),
});
type FormState = z.infer<typeof schema>;
const state = reactive<FormState>({
  name: props.account?.name ?? "",
  accountType: props.account?.accountType ?? "Bank",
  createdAt: props.account?.createdAt ?? createdAt,
  currencyCode: props.account?.currencyCode ?? "USD",
  startingBalance: props.account?.startingBalance ?? 0,
  isCashFlow: props.account?.isCashFlow ?? false,
  isActive: props.account?.isActive ?? true,
});

const { error, mutateAsync } = useCreateAccountMutation();

async function createAccount(event: FormSubmitEvent<FormState>) {
  const done = await mutateAsync({
    id: props.account?.id,
    name: event.data.name,
    accountType: event.data.accountType,
    createdAt: event.data.createdAt,
    currencyCode: event.data.currencyCode,
    startingBalance: event.data.startingBalance,
    isCashFlow: event.data.isCashFlow,
    isActive: event.data.isActive,
  });
  if (done.success) {
    router.push({
      name: "/app/finance/account/",
    });
  }
}
</script>

<template>
  <UForm :state="state" :schema="schema" class="space-y-4" @submit="createAccount">
    <UFormField label="Name" name="name">
      <UInput v-model="state.name" class="w-full" />
    </UFormField>
    <UFormField label="Account Type" name="accountType">
      <USelectMenu v-model="state.accountType" :items="Object.values(AccountType)" class="w-full" />
    </UFormField>
    <UFormField label="Created At" name="createdAt">
      <UInput
        :model-value="dayjs(state.createdAt).format('YYYY-MM-DDTHH:mm')"
        type="datetime-local"
        class="w-full"
        @update:model-value="($event) => (state.createdAt = dayjs($event).toDate())"
      />
    </UFormField>
    <UFormField label="Currency Code" name="currencyCode">
      <USelectMenu
        v-model="state.currencyCode"
        :items="
          currencies?.currency.map((c) => ({
            label: `${c.code} - ${c.name}`,
            value: c.code,
          }))
        "
        :value-key="'value'"
        class="w-full"
      />
    </UFormField>
    <UFormField label="Starting Balance" name="startingBalance">
      <UInputNumber
        v-model="state.startingBalance"
        :format-options="{
          style: 'currency',
          currency: state.currencyCode,
          currencyDisplay: 'code',
          currencySign: 'standard',
        }"
        class="w-full"
      />
    </UFormField>
    <UFormField name="isCashFlow">
      <UCheckbox v-model="state.isCashFlow" label="Is cash flow?" />
    </UFormField>
    <UFormField name="isActive">
      <UCheckbox v-model="state.isActive" label="Is active?" />
    </UFormField>
    <UButton v-if="account" type="submit"> <UIcon name="i-lucide-save" /> Save </UButton>
    <UButton v-else type="submit"> <UIcon name="i-lucide-plus" /> Create </UButton>
    <p v-if="error" class="text-error">{{ error?.message }}</p>
  </UForm>
</template>
