<script setup lang="ts">
import { useAccountsQuery, useCreateAccountsMutation } from "@/lib/account";
import type { AccountTypeOrigin } from "@/lib/hacks/account-type";
import { useCreateTransactionsMutation, useTransactionsQuery } from "@/lib/transaction";
import type { AccordionItem } from "@nuxt/ui";

const items: AccordionItem[] = [
  {
    label: "Import Accounts",
    value: "import-accounts",
  },
  {
    label: "Import Transaction",
    value: "import-transactions",
  },
  {
    label: "Export everything",
    value: "export-everything",
  },
];

const accountCsv = ref("Account	Account Type	Starting Balance	Currency	Created At");
const transactionCsv = ref("Date	Account	Amount	Currency	Transaction	Notes	Category");
const error = ref<string | null>(null);
const router = useRouter();

const { data: accounts } = useAccountsQuery();
const { data: transactions } = useTransactionsQuery();
const { mutateAsync: createAccounts, error: importAccountsError } = useCreateAccountsMutation();
const { mutateAsync: createTransactions, error: importTransactionsError } =
  useCreateTransactionsMutation();

async function importAccounts() {
  error.value = null;
  const [header, ...lines] = accountCsv.value.trim().split("\n");
  if (!header) {
    error.value = "CSV header is missing";
    return;
  }
  const headerNames = header.split("\t");
  const accountIndex = headerNames.indexOf("Account");
  const accountTypeIndex = headerNames.indexOf("Account Type");
  const startingBalanceIndex = headerNames.indexOf("Starting Balance");
  const currencyIndex = headerNames.indexOf("Currency");
  const createdAtIndex = headerNames.indexOf("Created At");
  if (
    accountIndex === -1 ||
    accountTypeIndex === -1 ||
    startingBalanceIndex === -1 ||
    currencyIndex === -1 ||
    createdAtIndex === -1
  ) {
    error.value = "CSV header is missing required fields";
    return;
  }
  const data = [];
  for (const line of lines) {
    if (line.trim() === "") continue;
    const values = line.split("\t");
    const name = values[accountIndex] ?? "";
    const accountType = values[accountTypeIndex] as AccountTypeOrigin;
    const startingBalance = Number(values[startingBalanceIndex]?.replaceAll(",", ""));
    const currencyCode = values[currencyIndex] ?? "";
    const createdAt = values[createdAtIndex] ? new Date(values[createdAtIndex]) : new Date();
    data.push({
      name,
      accountType,
      startingBalance,
      currencyCode,
      isCashFlow: isCashFlow(accountType),
      isActive: true,
      createdAt,
    });
  }
  const done = await createAccounts(data);
  if (done.success) {
    router.push({
      name: "/app/finance/account/",
    });
  } else {
    error.value = importAccountsError.value?.message || "Failed to import accounts";
  }
}

async function importTransactions() {
  error.value = null;
  const [header, ...lines] = transactionCsv.value.trim().split("\n");
  if (!header) {
    error.value = "CSV header is missing";
    return;
  }
  const headerNames = header.split("\t");
  const dateIndex = headerNames.indexOf("Date");
  const accountIndex = headerNames.indexOf("Account");
  const amountIndex = headerNames.indexOf("Amount");
  const currencyIndex = headerNames.indexOf("Currency");
  const transactionIndex = headerNames.indexOf("Transaction");
  const notesIndex = headerNames.indexOf("Notes");
  const categoryIndex = headerNames.indexOf("Category");
  if (
    dateIndex === -1 ||
    accountIndex === -1 ||
    amountIndex === -1 ||
    currencyIndex === -1 ||
    transactionIndex === -1 ||
    notesIndex === -1 ||
    categoryIndex === -1
  ) {
    error.value = "CSV header is missing required fields";
    return;
  }
  const items = [];
  for (const line of lines) {
    if (line.trim() === "") continue;
    const values = line.split("\t");
    const date = values[dateIndex] ? new Date(values[dateIndex]) : new Date();
    const account = values[accountIndex];
    const amount = Number(values[amountIndex]?.replaceAll(",", ""));
    const currency = values[currencyIndex];
    const title = values[transactionIndex] ?? "";
    const notes = values[notesIndex];
    const category = values[categoryIndex];
    items.push({ date, account, amount, currency, title, notes, category });
  }
  const itemsByDate = Object.groupBy(items, (d) => d.date.valueOf() + d.title);
  const data = [];
  for (const key in itemsByDate) {
    const items = itemsByDate[key];
    if (!items || !items.length) continue;
    data.push({
      title: items.find((item) => item.title)?.title ?? "",
      transactions: items.map((item) => ({
        amount: item.amount,
        accountName: item.account?.trim() ?? "",
        notes: item.notes ?? "",
        categoryName: item.category ?? "",
      })),
      timestamp: items[0]?.date ? new Date(items[0]?.date) : new Date(),
    });
  }
  const done = await createTransactions(data);
  if (done.success) {
    router.push({
      name: "/app/finance/transaction/",
    });
  } else {
    error.value = importTransactionsError.value?.message || "Failed to import transactions";
  }
}

function isCashFlow(accountType: AccountTypeOrigin): boolean {
  return (
    accountType === "Cash" ||
    accountType === "Wallet" ||
    accountType === "Bank" ||
    accountType === "CreditCard"
  );
}
</script>

<template>
  <AppPage title="Import/Export">
    <p v-if="error" class="text-error">{{ error }}</p>
    <UAccordion :items="items" type="multiple">
      <template #body="{ item }">
        <div v-if="item.value === 'import-accounts'" class="flex flex-col gap-4">
          <UTextarea v-model="accountCsv" :rows="8" class="font-mono" />
          <div>
            <UButton color="primary" @click="importAccounts">Import Accounts</UButton>
          </div>
        </div>
        <div v-else-if="item.value === 'import-transactions'" class="flex flex-col gap-4">
          <UTextarea v-model="transactionCsv" :rows="8" class="font-mono" />
          <div>
            <UButton color="primary" @click="importTransactions">Import Transactions</UButton>
          </div>
        </div>
        <div v-else-if="item.value === 'export-everything'" class="flex flex-col gap-4">
          <UTextarea
            :disabled="true"
            :rows="8"
            :model-value="
              JSON.stringify(
                {
                  accounts,
                  transactions,
                },
                null,
                2,
              )
            "
            class="font-mono"
          />
        </div>
      </template>
    </UAccordion>
  </AppPage>
</template>
