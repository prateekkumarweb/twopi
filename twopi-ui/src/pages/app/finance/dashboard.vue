<script setup lang="ts">
import { useAccountsQuery } from "@/lib/account";
import { useCategoryQuery } from "@/lib/category";
import { useCurrencyQuery, useCurrencyRatesQuery, useDashboardQuery } from "@/lib/currency";
import { useTransactionsQuery } from "@/lib/transaction";

const { data: dashboardData } = useDashboardQuery();
const { data: currencies } = useCurrencyQuery();
const { data: currencyRates } = useCurrencyRatesQuery();
const { data: accounts } = useAccountsQuery();
const { data: categoriesData } = useCategoryQuery();
const { data: transactions } = useTransactionsQuery();

const account = (id: string) => {
  return accounts.value?.accounts.find((a) => a.account.id === id);
};
const category = (id?: string | null) => {
  return categoriesData.value?.categories.find((c) => c.id === id);
};

const currenciesToShow = ["USD", "INR", "AED", "CNY", "EUR", "GBP", "JPY"];
const currentCurrency = ref("USD");
const currentCurrencyData = computed(() =>
  currencies.value?.currency.find((c) => c.code === currentCurrency.value),
);

const today = new Date();
const monthAndYear = reactive({
  month: today.getUTCMonth(),
  year: today.getUTCFullYear(),
});

const wealth = computed(() => {
  let wealth = 0;
  accounts.value?.accounts.forEach((account) => {
    wealth +=
      account.account.starting_balance /
      Math.pow(10, account.currency.decimal_digits) /
      (currencyRates.value?.rates.data?.[account.currency.code]?.value ?? 1);
  });
  transactions.value?.transactions.forEach((transaction) => {
    transaction.items.forEach((t) => {
      wealth +=
        t.amount /
        Math.pow(10, account(t.account_id)?.currency.decimal_digits ?? 2) /
        (currencyRates.value?.rates.data?.[account(t.account_id)?.currency.code ?? "USD"]?.value ??
          1);
    });
  });
  return wealth;
});

const daysInMonth = computed(() => {
  const days = [];
  days.push();
  const date = new Date(Date.UTC(monthAndYear.year, monthAndYear.month, 1));
  const firstDay = date.getTime();
  while (date.getUTCMonth() === monthAndYear.month) {
    days.push(new Date(date));
    date.setDate(date.getUTCDate() + 1);
  }
  return { days, firstDay };
});

const chartData = computed(() => {
  let cumulative = 0;
  let cashFlowCumulative = 0;
  const categories: { [key: string]: number } = {};
  accounts.value?.accounts
    ?.filter(
      (account) => new Date(account.account.created_at).getTime() < daysInMonth.value.firstDay,
    )
    .forEach((account) => {
      cumulative +=
        account.account.starting_balance /
        Math.pow(10, account.currency.decimal_digits) /
        (currencyRates.value?.rates.data?.[account.currency.code]?.value ?? 1);
      if (account.account.is_cash_flow) {
        cashFlowCumulative +=
          account.account.starting_balance /
          Math.pow(10, account.currency.decimal_digits) /
          (currencyRates.value?.rates.data?.[account.currency.code]?.value ?? 1);
      }
    });
  transactions.value?.transactions
    ?.filter(
      (transaction) =>
        new Date(transaction.transaction.timestamp).getTime() < daysInMonth.value.firstDay,
    )
    .forEach((transaction) => {
      transaction.items.forEach((t) => {
        cumulative +=
          t.amount /
          Math.pow(10, account(t.account_id)?.currency.decimal_digits ?? 2) /
          (currencyRates.value?.rates.data?.[account(t.account_id)?.currency.code ?? "USD"]
            ?.value ?? 1);
        if (account(t.account_id)?.account.is_cash_flow) {
          cashFlowCumulative +=
            t.amount /
            Math.pow(10, account(t.account_id)?.currency.decimal_digits ?? 2) /
            (currencyRates.value?.rates.data?.[account(t.account_id)?.currency.code ?? "USD"]
              ?.value ?? 1);
        }
      });
    });

  const wealthData = daysInMonth.value.days.map((d) => {
    const dateStart = d.getTime();
    const dateEnd = dateStart + 24 * 60 * 60 * 1000;
    let wealth = 0;
    let cashFlow = 0;
    accounts.value?.accounts
      ?.filter(
        (account) =>
          dateStart <= new Date(account.account.created_at).getTime() &&
          new Date(account.account.created_at).getTime() < dateEnd,
      )
      .forEach((account) => {
        wealth +=
          account.account.starting_balance /
          Math.pow(10, account.currency.decimal_digits) /
          (currencyRates.value?.rates.data?.[account.currency.code]?.value ?? 1);
        if (account.account.is_cash_flow) {
          cashFlow +=
            account.account.starting_balance /
            Math.pow(10, account.currency.decimal_digits) /
            (currencyRates.value?.rates.data?.[account.currency.code]?.value ?? 1);
        }
      });
    transactions.value?.transactions
      ?.filter(
        (transaction) =>
          dateStart <= new Date(transaction.transaction.timestamp).getTime() &&
          new Date(transaction.transaction.timestamp).getTime() < dateEnd,
      )
      .forEach((transaction) => {
        transaction.items.forEach((t) => {
          const amount =
            t.amount /
            Math.pow(10, account(t.account_id)?.currency.decimal_digits ?? 2) /
            (currencyRates.value?.rates.data?.[account(t.account_id)?.currency.code ?? "USD"]
              ?.value ?? 1);
          if (t.category_id) {
            categories[category(t.category_id)?.name ?? ""] =
              (categories[category(t.category_id)?.name ?? ""] ?? 0) + amount;
          }
          wealth += amount;
          if (account(t.account_id)?.account.is_cash_flow) {
            cashFlow += amount;
          }
        });
      });

    cumulative += wealth;
    cashFlowCumulative += cashFlow;
    return {
      date: `${d.getUTCDate()}`,
      wealth: cumulative,
      cashFlow: cashFlowCumulative,
    };
  });

  return {
    wealthData,
  };
});

const current_month = computed(() => dashboardData.value?.dashboard.last_3m[2]);
const prev_month = computed(() => dashboardData.value?.dashboard.last_3m[1]);
const prev_prev_month = computed(() => dashboardData.value?.dashboard.last_3m[0]);

const categories = computed(() =>
  Object.entries(dashboardData.value?.dashboard.categoies_last_3m ?? {})
    .map(([name, value]) => {
      const current_value = Object.entries(value[2] ?? {}).reduce(
        (acc, [currency, value]) =>
          acc + value / (currencyRates.value?.rates.data?.[currency]?.value ?? 1),
        0,
      );
      const prev_value = Object.entries(value[1] ?? {}).reduce(
        (acc, [currency, value]) =>
          acc + value / (currencyRates.value?.rates.data?.[currency]?.value ?? 1),
        0,
      );
      const prev_prev_value = Object.entries(value[0] ?? {}).reduce(
        (acc, [currency, value]) =>
          acc + value / (currencyRates.value?.rates.data?.[currency]?.value ?? 1),
        0,
      );
      return {
        name: category(name)?.name ?? name,
        current_value,
        prev_value,
        prev_prev_value,
      };
    })
    .toSorted((a, b) => (a.name < b.name ? -1 : 1)),
);
</script>

<template>
  <AppPage title="Dashboard">
    <template #actions>
      <USelect
        v-model="monthAndYear.month"
        :items="
          Array.from({ length: 12 }, (_pStores, i) => i).map((value) => ({
            value,
            label: Intl.DateTimeFormat('en', { month: 'short' }).format(new Date(0, value)),
          }))
        "
      />
      <UInputNumber
        v-model="monthAndYear.year"
        orientation="vertical"
        :format-options="{
          useGrouping: false,
        }"
      />
      <USelect v-model="currentCurrency" :items="currenciesToShow" />
    </template>
    <UCard>
      <template #header>
        <div class="text-xl font-semibold">Total Wealth</div>
      </template>
      <CurrencyDisplay
        :value="
          wealth *
          (currencyRates?.rates.data?.[currentCurrency]?.value ?? 1) *
          Math.pow(10, currentCurrencyData?.decimal_digits ?? 0)
        "
        :currency-code="currentCurrency"
        :decimal-digits="currentCurrencyData?.decimal_digits ?? 0"
      />
    </UCard>
    <UCard>
      <template #header>
        <div class="text-xl font-semibold">Wealth</div>
        <div class="text-sm">
          {{
            Intl.DateTimeFormat("en", {
              month: "long",
              year: "numeric",
            }).format(new Date(monthAndYear.year, monthAndYear.month))
          }}
        </div>
      </template>
      <pre class="max-h-64 overflow-auto">{{
        JSON.stringify(
          chartData.wealthData.map(({ date, wealth, cashFlow }) => ({
            date: Intl.DateTimeFormat("en", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }).format(new Date(monthAndYear.year, monthAndYear.month, Number(date))),
            wealth: Intl.NumberFormat("en", {
              currency: currentCurrency,
              style: "currency",
            }).format(wealth * (currencyRates?.rates.data?.[currentCurrency]?.value ?? 1)),
          })),
          null,
          2,
        )
      }}</pre>
      <template #footer>Cumulative wealth over the month</template>
    </UCard>
    <UCard>
      <template #header>
        <div class="text-xl font-semibold">Cash flow</div>
        <div class="text-sm">
          {{
            Intl.DateTimeFormat("en", {
              month: "long",
              year: "numeric",
            }).format(new Date(monthAndYear.year, monthAndYear.month))
          }}
        </div>
      </template>
      <pre class="max-h-64 overflow-auto">{{
        JSON.stringify(
          chartData.wealthData.map(({ date, wealth, cashFlow }) => ({
            date: Intl.DateTimeFormat("en", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }).format(new Date(monthAndYear.year, monthAndYear.month, Number(date))),
            cashFlow: Intl.NumberFormat("en", {
              currency: currentCurrency,
              style: "currency",
            }).format(cashFlow * (currencyRates?.rates.data?.[currentCurrency]?.value ?? 1)),
          })),
          null,
          2,
        )
      }}</pre>
      <template #footer>Cumulative wealth over the month</template>
    </UCard>
    <UCard>
      <template #header>
        <div class="text-xl font-semibold">Categories table</div>
      </template>
      <div class="overflow-auto">
        <table class="w-full table-auto border-collapse">
          <thead>
            <tr class="border border-gray-300 dark:border-gray-700">
              <th class="p-2 text-left">Category</th>
              <th class="p-2 text-right">
                {{
                  prev_prev_month &&
                  Intl.DateTimeFormat("en", {
                    month: "long",
                    year: "numeric",
                  }).format(new Date(prev_prev_month[1], prev_prev_month[0] - 1))
                }}
              </th>
              <th class="p-2 text-right">
                {{
                  prev_month &&
                  Intl.DateTimeFormat("en", {
                    month: "long",
                    year: "numeric",
                  }).format(new Date(prev_month[1], prev_month[0] - 1))
                }}
              </th>
              <th class="p-2 text-right">
                {{
                  current_month &&
                  Intl.DateTimeFormat("en", {
                    month: "long",
                    year: "numeric",
                  }).format(new Date(current_month[1], current_month[0] - 1))
                }}
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in categories"
              :key="c.name"
              class="border border-gray-300 dark:border-gray-700"
            >
              <td class="p-2">{{ c.name }}</td>
              <td class="p-2 text-right">
                <CurrencyDisplay
                  :value="
                    c.prev_prev_value *
                    (currencyRates?.rates.data?.[currentCurrency]?.value ?? 1) *
                    Math.pow(10, currentCurrencyData?.decimal_digits ?? 0)
                  "
                  :currency-code="currentCurrency"
                  :decimal-digits="currentCurrencyData?.decimal_digits ?? 0"
                />
              </td>
              <td class="p-2 text-right">
                <CurrencyDisplay
                  :value="
                    c.prev_value *
                    (currencyRates?.rates.data?.[currentCurrency]?.value ?? 1) *
                    Math.pow(10, currentCurrencyData?.decimal_digits ?? 0)
                  "
                  :currency-code="currentCurrency"
                  :decimal-digits="currentCurrencyData?.decimal_digits ?? 0"
                />
              </td>
              <td class="p-2 text-right">
                <CurrencyDisplay
                  :value="
                    c.current_value *
                    (currencyRates?.rates.data?.[currentCurrency]?.value ?? 1) *
                    Math.pow(10, currentCurrencyData?.decimal_digits ?? 0)
                  "
                  :currency-code="currentCurrency"
                  :decimal-digits="currentCurrencyData?.decimal_digits ?? 0"
                />
              </td>
              <td class="w-1/6 px-4 py-2">
                <UProgress
                  v-if="Math.max(...categories.map((c) => Math.abs(c.current_value))) > 0"
                  :model-value="
                    Math.abs(c.current_value * 100) /
                    Math.max(...categories.map((c) => Math.abs(c.current_value)))
                  "
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <template #footer>Income/Expense in each category</template>
    </UCard>
  </AppPage>
</template>
