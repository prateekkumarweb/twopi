import { makePersisted } from "@solid-primitives/storage";
import { useQuery } from "@tanstack/solid-query";
import { createFileRoute } from "@tanstack/solid-router";
import { createMemo, createSignal, For, Show } from "solid-js";
import CurrencyDisplay from "~/components/CurrencyDisplay";
import { PageLayout } from "~/components/PageLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Progress } from "~/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectHiddenSelect,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  accountQueryOptions,
  categoryQueryOptions,
  currencyQueryOptions,
  currencyRatesQueryOptions,
  dashboardQueryOptions,
  transactionQueryOptions,
} from "~/lib/query-options";

export const Route = createFileRoute("/app/")({
  component: RouteComponent,
});

const [currentCurrency, setCurrentCurrency] = makePersisted(
  // eslint-disable-next-line solid/reactivity
  createSignal("USD"),
  {
    name: "currentCurrency",
  },
);

function RouteComponent() {
  const currenciesQuery = useQuery(currencyQueryOptions);
  const currencyRatesQuery = useQuery(currencyRatesQueryOptions);
  const dashboardQuery = useQuery(dashboardQueryOptions);
  const accountsQuery = useQuery(accountQueryOptions);
  const categoriesQuery = useQuery(categoryQueryOptions);
  const transactionsQuery = useQuery(transactionQueryOptions);

  const account = (id: string) =>
    accountsQuery.data?.accounts.find((account) => account.account.id === id);
  const category = (id?: string | null) =>
    categoriesQuery.data?.categories.find((category) => category.id === id);

  const currenciesToShow = ["USD", "INR", "AED", "CNY", "EUR", "GBP", "JPY"];
  const currencies =
    currenciesQuery.data?.data?.filter((c) =>
      currenciesToShow.includes(c.code),
    ) ?? [];
  const currentCurrencyData = () =>
    currencies.find((c) => c.code === currentCurrency());

  const today = new Date();
  const [monthAndYear, setMonthAndYear] = createSignal({
    month: today.getUTCMonth(),
    year: today.getUTCFullYear(),
  });

  const wealth = createMemo(() => {
    let wealth = 0;
    accountsQuery.data?.accounts?.forEach((account) => {
      wealth +=
        account.account.starting_balance /
        Math.pow(10, account.currency.decimal_digits) /
        (currencyRatesQuery.data?.data?.[account.currency.code]?.value ?? 1);
    });
    transactionsQuery.data?.transactions?.forEach((transaction) => {
      transaction.items.forEach((t) => {
        wealth +=
          t.amount /
          Math.pow(10, account(t.account_id)?.currency.decimal_digits ?? 2) /
          (currencyRatesQuery.data?.data?.[
            account(t.account_id)?.currency.code ?? "USD"
          ]?.value ?? 1);
      });
    });
    return wealth;
  });

  const daysInMonth = createMemo(() => {
    const days = [];
    days.push();
    const date = new Date(
      Date.UTC(monthAndYear().year, monthAndYear().month, 1),
    );
    const firstDay = date.getTime();
    while (date.getUTCMonth() === monthAndYear().month) {
      days.push(new Date(date));
      date.setDate(date.getUTCDate() + 1);
    }
    return { days, firstDay };
  });

  const chartData = createMemo(() => {
    let cumulative = 0;
    let cashFlowCumulative = 0;
    const categories: { [key: string]: number } = {};
    accountsQuery.data?.accounts
      ?.filter(
        (account) =>
          new Date(account.account.created_at).getTime() <
          daysInMonth().firstDay,
      )
      .forEach((account) => {
        cumulative +=
          account.account.starting_balance /
          Math.pow(10, account.currency.decimal_digits) /
          (currencyRatesQuery.data?.data?.[account.currency.code]?.value ?? 1);
        if (account.account.is_cash_flow) {
          cashFlowCumulative +=
            account.account.starting_balance /
            Math.pow(10, account.currency.decimal_digits) /
            (currencyRatesQuery.data?.data?.[account.currency.code]?.value ??
              1);
        }
      });
    transactionsQuery.data?.transactions
      ?.filter(
        (transaction) =>
          new Date(transaction.transaction.timestamp).getTime() <
          daysInMonth().firstDay,
      )
      .forEach((transaction) => {
        transaction.items.forEach((t) => {
          cumulative +=
            t.amount /
            Math.pow(10, account(t.account_id)?.currency.decimal_digits ?? 2) /
            (currencyRatesQuery.data?.data[
              account(t.account_id)?.currency.code ?? "USD"
            ]?.value ?? 1);
          if (account(t.account_id)?.account.is_cash_flow) {
            cashFlowCumulative +=
              t.amount /
              Math.pow(
                10,
                account(t.account_id)?.currency.decimal_digits ?? 2,
              ) /
              (currencyRatesQuery.data?.data[
                account(t.account_id)?.currency.code ?? "USD"
              ]?.value ?? 1);
          }
        });
      });

    const wealthData = daysInMonth().days.map((d) => {
      const dateStart = d.getTime();
      const dateEnd = dateStart + 24 * 60 * 60 * 1000;
      let wealth = 0;
      let cashFlow = 0;
      accountsQuery.data?.accounts
        ?.filter(
          (account) =>
            dateStart <= new Date(account.account.created_at).getTime() &&
            new Date(account.account.created_at).getTime() < dateEnd,
        )
        .forEach((account) => {
          wealth +=
            account.account.starting_balance /
            Math.pow(10, account.currency.decimal_digits) /
            (currencyRatesQuery.data?.data[account.currency.code]?.value ?? 1);
          if (account.account.is_cash_flow) {
            cashFlow +=
              account.account.starting_balance /
              Math.pow(10, account.currency.decimal_digits) /
              (currencyRatesQuery.data?.data[account.currency.code]?.value ??
                1);
          }
        });
      transactionsQuery.data?.transactions
        ?.filter(
          (transaction) =>
            dateStart <=
              new Date(transaction.transaction.timestamp).getTime() &&
            new Date(transaction.transaction.timestamp).getTime() < dateEnd,
        )
        .forEach((transaction) => {
          transaction.items.forEach((t) => {
            const amount =
              t.amount /
              Math.pow(
                10,
                account(t.account_id)?.currency.decimal_digits ?? 2,
              ) /
              (currencyRatesQuery.data?.data[
                account(t.account_id)?.currency.code ?? "USD"
              ]?.value ?? 1);
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

  const current_month = createMemo(() => dashboardQuery.data?.last_3m?.[2]);
  const prev_month = createMemo(() => dashboardQuery.data?.last_3m?.[1]);
  const prev_prev_month = createMemo(() => dashboardQuery.data?.last_3m?.[0]);

  const categories = createMemo(() =>
    Object.entries(dashboardQuery.data?.categoies_last_3m ?? {})
      .map(([name, value]) => {
        const current_value = Object.entries(value[2] ?? {}).reduce(
          (acc, [currency, value]) =>
            acc +
            value / (currencyRatesQuery.data?.data?.[currency]?.value ?? 1),
          0,
        );
        const prev_value = Object.entries(value[1] ?? {}).reduce(
          (acc, [currency, value]) =>
            acc +
            value / (currencyRatesQuery.data?.data?.[currency]?.value ?? 1),
          0,
        );
        const prev_prev_value = Object.entries(value[0] ?? {}).reduce(
          (acc, [currency, value]) =>
            acc +
            value / (currencyRatesQuery.data?.data?.[currency]?.value ?? 1),
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

  return (
    <PageLayout
      title="Dashboard"
      actions={
        <>
          <Select
            options={Array.from({ length: 12 }, (_, i) => i)}
            value={String(monthAndYear().month)}
            onChange={(e) =>
              setMonthAndYear({
                ...monthAndYear(),
                month: Number(e),
              })
            }
            itemComponent={(props) => (
              <SelectItem item={props.item}>
                {Intl.DateTimeFormat("en", { month: "short" }).format(
                  new Date(0, Number(props.item.rawValue)),
                )}
              </SelectItem>
            )}
          >
            <SelectHiddenSelect />
            <SelectTrigger>
              <SelectValue<string>>
                {(state) =>
                  Intl.DateTimeFormat("en", { month: "short" }).format(
                    new Date(0, Number(state.selectedOption())),
                  )
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent />
          </Select>
          <Input
            type="number"
            value={monthAndYear().year}
            onChange={(e) =>
              setMonthAndYear({
                ...monthAndYear(),
                year: Number(e.target.value),
              })
            }
          />
          <Select
            options={currenciesToShow}
            value={currentCurrency()}
            placeholder="Select account type"
            onChange={setCurrentCurrency}
            itemComponent={(props) => (
              <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
            )}
          >
            <SelectHiddenSelect />
            <SelectTrigger>
              <SelectValue<string>>
                {(state) => state.selectedOption()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent />
          </Select>
        </>
      }
    >
      <h2 class="text-center text-lg font-bold">Total wealth</h2>
      <div class="mb-4 flex flex-wrap items-center justify-center gap-4">
        <div class="bg-accent shadow-xs p-2 text-2xl">
          <CurrencyDisplay
            value={
              wealth() *
              (currencyRatesQuery.data?.data?.[currentCurrency()]?.value ?? 1) *
              Math.pow(10, currentCurrencyData()?.decimal_digits ?? 0)
            }
            currencyCode={currentCurrency()}
            decimalDigits={currentCurrencyData()?.decimal_digits ?? 0}
          />
        </div>
      </div>
      <div class="flex w-full flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Wealth</CardTitle>
            <CardDescription>
              {Intl.DateTimeFormat("en", {
                month: "long",
                year: "numeric",
              }).format(new Date(monthAndYear().year, monthAndYear().month))}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre class="max-h-64 overflow-auto">
              {JSON.stringify(
                chartData().wealthData.map(({ date, wealth, cashFlow }) => ({
                  date: Intl.DateTimeFormat("en", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }).format(
                    new Date(
                      monthAndYear().year,
                      monthAndYear().month,
                      Number(date),
                    ),
                  ),
                  wealth: Intl.NumberFormat("en", {
                    currency: currentCurrency(),
                    style: "currency",
                  }).format(
                    wealth *
                      (currencyRatesQuery.data?.data[currentCurrency()]
                        ?.value ?? 1),
                  ),
                  cashFlow: Intl.NumberFormat("en", {
                    currency: currentCurrency(),
                    style: "currency",
                  }).format(
                    cashFlow *
                      (currencyRatesQuery.data?.data[currentCurrency()]
                        ?.value ?? 1),
                  ),
                })),
                null,
                2,
              )}
            </pre>
          </CardContent>
          <CardFooter>Cumulative wealth over the month</CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow</CardTitle>
            <CardDescription>
              {Intl.DateTimeFormat("en", {
                month: "long",
                year: "numeric",
              }).format(new Date(monthAndYear().year, monthAndYear().month))}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre class="max-h-64 overflow-auto">
              {JSON.stringify(
                chartData().wealthData.map(({ date, wealth, cashFlow }) => ({
                  date: Intl.DateTimeFormat("en", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }).format(
                    new Date(
                      monthAndYear().year,
                      monthAndYear().month,
                      Number(date),
                    ),
                  ),
                  wealth: Intl.NumberFormat("en", {
                    currency: currentCurrency(),
                    style: "currency",
                  }).format(
                    wealth *
                      (currencyRatesQuery.data?.data[currentCurrency()]
                        ?.value ?? 1),
                  ),
                  cashFlow: Intl.NumberFormat("en", {
                    currency: currentCurrency(),
                    style: "currency",
                  }).format(
                    cashFlow *
                      (currencyRatesQuery.data?.data[currentCurrency()]
                        ?.value ?? 1),
                  ),
                })),
                null,
                2,
              )}
            </pre>
          </CardContent>
          <CardFooter>Cumulative cash flow over the month</CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Categories Table</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead class="text-right">
                    <Show when={prev_prev_month()}>
                      {(prev_prev_month) =>
                        Intl.DateTimeFormat("en", {
                          month: "long",
                          year: "numeric",
                        }).format(
                          new Date(
                            prev_prev_month()?.[1],
                            prev_prev_month()?.[0] - 1,
                          ),
                        )
                      }
                    </Show>
                  </TableHead>
                  <TableHead class="text-right">
                    <Show when={prev_month()}>
                      {(prev_month) =>
                        Intl.DateTimeFormat("en", {
                          month: "long",
                          year: "numeric",
                        }).format(
                          new Date(prev_month()?.[1], prev_month()?.[0] - 1),
                        )
                      }
                    </Show>
                  </TableHead>
                  <TableHead class="text-right">
                    <Show when={current_month()}>
                      {(current_month) =>
                        Intl.DateTimeFormat("en", {
                          month: "long",
                          year: "numeric",
                        }).format(
                          new Date(
                            current_month()?.[1],
                            current_month()?.[0] - 1,
                          ),
                        )
                      }
                    </Show>
                  </TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                <For each={categories()}>
                  {({ name, current_value, prev_value, prev_prev_value }) => (
                    <TableRow>
                      <TableCell>{name}</TableCell>
                      <TableCell class="text-right">
                        <CurrencyDisplay
                          value={
                            prev_prev_value *
                            (currencyRatesQuery.data?.data?.[currentCurrency()]
                              ?.value ?? 1) *
                            Math.pow(
                              10,
                              currentCurrencyData()?.decimal_digits ?? 0,
                            )
                          }
                          currencyCode={currentCurrency()}
                          decimalDigits={
                            currentCurrencyData()?.decimal_digits ?? 0
                          }
                        />
                      </TableCell>
                      <TableCell class="text-right">
                        <CurrencyDisplay
                          value={
                            prev_value *
                            (currencyRatesQuery.data?.data?.[currentCurrency()]
                              ?.value ?? 1) *
                            Math.pow(
                              10,
                              currentCurrencyData()?.decimal_digits ?? 0,
                            )
                          }
                          currencyCode={currentCurrency()}
                          decimalDigits={
                            currentCurrencyData()?.decimal_digits ?? 0
                          }
                        />
                      </TableCell>
                      <TableCell class="text-right">
                        <CurrencyDisplay
                          value={
                            current_value *
                            (currencyRatesQuery.data?.data?.[currentCurrency()]
                              ?.value ?? 1) *
                            Math.pow(
                              10,
                              currentCurrencyData()?.decimal_digits ?? 0,
                            )
                          }
                          currencyCode={currentCurrency()}
                          decimalDigits={
                            currentCurrencyData()?.decimal_digits ?? 0
                          }
                        />
                      </TableCell>
                      <TableCell class="w-1/6">
                        <Progress
                          value={
                            Math.abs(current_value * 100) /
                            Math.max(
                              ...categories().map((c) =>
                                Math.abs(c.current_value),
                              ),
                            )
                          }
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </For>
                <TableRow>
                  <TableCell class="font-semibold">Total</TableCell>
                  <TableCell class="text-right font-semibold">
                    <CurrencyDisplay
                      value={
                        categories().reduce(
                          (acc, c) => acc + c.prev_prev_value,
                          0,
                        ) *
                        (currencyRatesQuery.data?.data?.[currentCurrency()]
                          ?.value ?? 1) *
                        Math.pow(10, currentCurrencyData()?.decimal_digits ?? 0)
                      }
                      currencyCode={currentCurrency()}
                      decimalDigits={currentCurrencyData()?.decimal_digits ?? 0}
                    />
                  </TableCell>
                  <TableCell class="text-right font-semibold">
                    <CurrencyDisplay
                      value={
                        categories().reduce((acc, c) => acc + c.prev_value, 0) *
                        (currencyRatesQuery.data?.data?.[currentCurrency()]
                          ?.value ?? 1) *
                        Math.pow(10, currentCurrencyData()?.decimal_digits ?? 0)
                      }
                      currencyCode={currentCurrency()}
                      decimalDigits={currentCurrencyData()?.decimal_digits ?? 0}
                    />
                  </TableCell>
                  <TableCell class="text-right font-semibold">
                    <CurrencyDisplay
                      value={
                        categories().reduce(
                          (acc, c) => acc + c.current_value,
                          0,
                        ) *
                        (currencyRatesQuery.data?.data?.[currentCurrency()]
                          ?.value ?? 1) *
                        Math.pow(10, currentCurrencyData()?.decimal_digits ?? 0)
                      }
                      currencyCode={currentCurrency()}
                      decimalDigits={currentCurrencyData()?.decimal_digits ?? 0}
                    />
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>Income/Expense in each category</CardFooter>
        </Card>
      </div>
    </PageLayout>
  );
}
