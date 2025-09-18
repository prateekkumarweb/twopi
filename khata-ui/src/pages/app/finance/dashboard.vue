<script setup lang="ts">
import { useAccountsQuery } from "@/lib/account";
import { useCategoryQuery } from "@/lib/category";
import { useCurrencyQuery, useCurrencyRatesQuery, useDashboardQuery } from "@/lib/currency";
import { useTransactionsQuery } from "@/lib/transaction";
import { VisAxis, VisLine, VisXYContainer } from "@unovis/vue";
import { useStorage } from "@vueuse/core";

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
const currentCurrency = useStorage("finance-dashboard-currency", "USD");
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
      date: d.getUTCDate(),
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

type ChartDataRecord = {
  date: number;
  wealth: number;
  cashFlow: number;
};
const chartDataRecords: ComputedRef<ChartDataRecord[]> = computed(() =>
  chartData.value.wealthData.map((d) => ({
    date: d.date,
    wealth: d.wealth * (currencyRates.value?.rates.data?.[currentCurrency.value]?.value ?? 1),
    cashFlow: d.cashFlow * (currencyRates.value?.rates.data?.[currentCurrency.value]?.value ?? 1),
  })),
);
const x = (d: ChartDataRecord) => d.date;
const y = [(d: ChartDataRecord) => d.wealth, (d: ChartDataRecord) => d.cashFlow];
</script>

<template>
  <AppPage title="Dashboard">
    <template #actions>
      <div class="flex gap-3">
        <USelect
          v-model="monthAndYear.month"
          :items="
            Array.from({ length: 12 }, (_, i) => i).map((value) => ({
              value,
              label: Intl.DateTimeFormat('en', { month: 'short' }).format(new Date(0, value)),
            }))
          "
          size="sm"
          class="min-w-20"
        />
        <UInputNumber
          v-model="monthAndYear.year"
          orientation="vertical"
          :format-options="{
            useGrouping: false,
          }"
          size="sm"
          class="min-w-24"
        />
        <USelect v-model="currentCurrency" :items="currenciesToShow" size="sm" class="min-w-20" />
      </div>
    </template>

    <!-- Modern Grid Layout -->
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <!-- Total Wealth Card - Spotlight -->
      <div class="lg:col-span-1">
        <UCard
          class="from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-primary-200 dark:border-primary-700 transform bg-gradient-to-br shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
        >
          <template #header>
            <div class="flex items-center gap-4">
              <div
                class="from-primary-500 to-primary-600 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg"
              >
                <svg
                  class="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  ></path>
                </svg>
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Total Wealth</h3>
                <p class="text-primary-600 dark:text-primary-400 text-sm">
                  Current portfolio value
                </p>
              </div>
            </div>
          </template>
          <div class="pb-4 pt-6">
            <div class="mb-2 text-4xl font-bold text-gray-900 dark:text-gray-100">
              <CurrencyDisplay
                :value="
                  wealth *
                  (currencyRates?.rates.data?.[currentCurrency]?.value ?? 1) *
                  Math.pow(10, currentCurrencyData?.decimal_digits ?? 0)
                "
                :currency-code="currentCurrency"
                :decimal-digits="currentCurrencyData?.decimal_digits ?? 0"
              />
            </div>
            <div class="flex items-center gap-2 text-sm">
              <span
                class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400"
              >
                <svg class="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                Portfolio
              </span>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Charts Section -->
      <div class="space-y-8 lg:col-span-2">
        <!-- Wealth Chart -->
        <UCard
          class="transform border-gray-200 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:border-gray-700"
        >
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30"
                >
                  <svg
                    class="h-5 w-5 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    ></path>
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Wealth Trend
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{
                      Intl.DateTimeFormat("en", {
                        month: "long",
                        year: "numeric",
                      }).format(new Date(monthAndYear.year, monthAndYear.month))
                    }}
                  </p>
                </div>
              </div>
            </div>
          </template>
          <div class="h-64 w-full">
            <VisXYContainer :data="chartDataRecords" class="h-full">
              <VisLine :x="x" :y="y[0]" />
              <VisAxis type="x" />
              <VisAxis
                type="y"
                :tick-format="
                  (x: number) =>
                    Intl.NumberFormat('en', {
                      currency: currentCurrency,
                      style: 'currency',
                      notation: 'compact',
                    }).format(x)
                "
              />
            </VisXYContainer>
          </div>
          <template #footer>
            <p class="text-sm text-gray-600 dark:text-gray-400">Cumulative wealth over the month</p>
          </template>
        </UCard>

        <!-- Cash Flow Chart -->
        <UCard
          class="transform border-gray-200 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:border-gray-700"
        >
          <template #header>
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30"
              >
                <svg
                  class="h-5 w-5 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  ></path>
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Cash Flow</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{
                    Intl.DateTimeFormat("en", {
                      month: "long",
                      year: "numeric",
                    }).format(new Date(monthAndYear.year, monthAndYear.month))
                  }}
                </p>
              </div>
            </div>
          </template>
          <div class="h-64 w-full">
            <VisXYContainer :data="chartDataRecords" class="h-full">
              <VisLine :x="x" :y="y[1]" />
              <VisAxis type="x" />
              <VisAxis
                type="y"
                :tick-format="
                  (x: number) =>
                    Intl.NumberFormat('en', {
                      currency: currentCurrency,
                      style: 'currency',
                      notation: 'compact',
                    }).format(x)
                "
              />
            </VisXYContainer>
          </div>
          <template #footer>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Cumulative cash flow over the month
            </p>
          </template>
        </UCard>
      </div>
    </div>

    <!-- Categories Section -->
    <div class="mt-12">
      <UCard
        class="border-gray-200 shadow-xl transition-all duration-300 hover:shadow-2xl dark:border-gray-700"
      >
        <template #header>
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30"
            >
              <svg
                class="h-5 w-5 text-purple-600 dark:text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                ></path>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Category Analysis
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Income and expenses by category
              </p>
            </div>
          </div>
        </template>
        <div class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th
                    class="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Category
                  </th>
                  <th
                    class="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    {{
                      prev_prev_month &&
                      Intl.DateTimeFormat("en", {
                        month: "short",
                        year: "numeric",
                      }).format(new Date(prev_prev_month[1], prev_prev_month[0] - 1))
                    }}
                  </th>
                  <th
                    class="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    {{
                      prev_month &&
                      Intl.DateTimeFormat("en", {
                        month: "short",
                        year: "numeric",
                      }).format(new Date(prev_month[1], prev_month[0] - 1))
                    }}
                  </th>
                  <th
                    class="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    {{
                      current_month &&
                      Intl.DateTimeFormat("en", {
                        month: "short",
                        year: "numeric",
                      }).format(new Date(current_month[1], current_month[0] - 1))
                    }}
                  </th>
                  <th
                    class="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody
                class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900"
              >
                <tr
                  v-for="(c, index) in categories"
                  :key="c.name"
                  class="transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  :class="
                    index % 2 === 0
                      ? 'bg-white dark:bg-gray-900'
                      : 'bg-gray-50/50 dark:bg-gray-800/50'
                  "
                >
                  <td class="whitespace-nowrap px-6 py-4">
                    <div class="flex items-center">
                      <div
                        class="mr-3 h-3 w-3 rounded-full shadow-sm"
                        :class="c.current_value >= 0 ? 'bg-green-400' : 'bg-red-400'"
                      ></div>
                      <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{
                        c.name
                      }}</span>
                    </div>
                  </td>
                  <td
                    class="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300"
                  >
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
                  <td
                    class="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300"
                  >
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
                  <td
                    class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-gray-100"
                  >
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
                  <td class="whitespace-nowrap px-6 py-4">
                    <div class="mx-auto w-full max-w-20">
                      <UProgress
                        v-if="Math.max(...categories.map((c) => Math.abs(c.current_value))) > 0"
                        :model-value="
                          Math.abs(c.current_value * 100) /
                          Math.max(...categories.map((c) => Math.abs(c.current_value)))
                        "
                        :color="c.current_value >= 0 ? 'success' : 'error'"
                        size="sm"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </UCard>
    </div>
  </AppPage>
</template>
