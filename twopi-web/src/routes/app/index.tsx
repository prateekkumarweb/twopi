import { useQueries } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import CurrencyDisplay from "~/components/CurrencyDisplay";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import { Input } from "~/components/ui/input";
import { Progress } from "~/components/ui/progress";
import {
  Select,
  SelectContent,
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
  transactionQueryOptions,
} from "~/lib/query-options";
import { isDefined } from "~/lib/utils";

export const Route = createFileRoute("/app/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { isPending, data, errors } = useQueries({
    queries: [
      accountQueryOptions(),
      transactionQueryOptions(),
      currencyRatesQueryOptions(),
      currencyQueryOptions(),
      categoryQueryOptions(),
    ],
    combine: (results) => {
      return {
        data: {
          accounts: results[0].data?.accounts,
          transactions: results[1].data?.transactions,
          currencyRates: results[2].data?.data,
          currencies: results[3].data?.data,
          categories: results[4].data?.categories,
        },
        isPending: results.some((result) => result.isPending),
        errors: results.map((result) => result.error).filter(isDefined),
      };
    },
  });
  const today = new Date();
  const [monthAndYear, setMonthAndYear] = useState({
    month: today.getUTCMonth(),
    year: today.getUTCFullYear(),
  });
  const previousMonthAndYear = {
    month: monthAndYear.month > 0 ? monthAndYear.month - 1 : 11,
    year: monthAndYear.month > 0 ? monthAndYear.year : monthAndYear.year - 1,
  };
  const [currentCurrency, setCurrency] = useState("USD");
  const currenciesToShow = ["USD", "INR", "AED", "CNY", "EUR", "GBP", "JPY"];
  const currencies =
    data.currencies?.filter((c) => currenciesToShow.includes(c.code)) ?? [];
  const currentCurrencyData = currencies.find(
    (c) => c.code === currentCurrency,
  );

  let wealth = 0;
  data.accounts?.forEach((account) => {
    wealth +=
      account.starting_balance /
      Math.pow(10, account.currency.decimal_digits) /
      (data.currencyRates?.[account.currency.code]?.value ?? 1);
  });
  data.transactions?.forEach((transaction) => {
    transaction.transaction_items.forEach((t) => {
      wealth +=
        t.amount /
        Math.pow(10, t.account.currency.decimal_digits) /
        (data.currencyRates?.[t.account.currency.code]?.value ?? 1);
    });
  });

  const chartData = useMemo(() => {
    const daysInMonth = [];
    daysInMonth.push();
    const date = new Date(Date.UTC(monthAndYear.year, monthAndYear.month, 1));
    const firstDay = date.getTime();
    while (date.getUTCMonth() === monthAndYear.month) {
      daysInMonth.push(new Date(date));
      date.setDate(date.getUTCDate() + 1);
    }

    let cumulative = 0;
    let cashFlowCumulative = 0;
    const categories: { [key: string]: number } = {};
    data.accounts
      ?.filter((account) => new Date(account.created_at).getTime() < firstDay)
      .forEach((account) => {
        cumulative +=
          account.starting_balance /
          Math.pow(10, account.currency.decimal_digits) /
          (data.currencyRates?.[account.currency.code]?.value ?? 1);
        if (account.is_cash_flow) {
          cashFlowCumulative +=
            account.starting_balance /
            Math.pow(10, account.currency.decimal_digits) /
            (data.currencyRates?.[account.currency.code]?.value ?? 1);
        }
      });
    data.transactions
      ?.filter(
        (transaction) => new Date(transaction.timestamp).getTime() < firstDay,
      )
      .forEach((transaction) => {
        transaction.transaction_items.forEach((t) => {
          cumulative +=
            t.amount /
            Math.pow(10, t.account.currency.decimal_digits) /
            (data.currencyRates?.[t.account.currency.code]?.value ?? 1);
          if (t.account.is_cash_flow) {
            cashFlowCumulative +=
              t.amount /
              Math.pow(10, t.account.currency.decimal_digits) /
              (data.currencyRates?.[t.account.currency.code]?.value ?? 1);
          }
        });
      });

    const wealthData = daysInMonth.map((d) => {
      const dateStart = d.getTime();
      const dateEnd = dateStart + 24 * 60 * 60 * 1000;
      let wealth = 0;
      let cashFlow = 0;
      data.accounts
        ?.filter(
          (account) =>
            dateStart <= new Date(account.created_at).getTime() &&
            new Date(account.created_at).getTime() < dateEnd,
        )
        .forEach((account) => {
          wealth +=
            account.starting_balance /
            Math.pow(10, account.currency.decimal_digits) /
            (data.currencyRates?.[account.currency.code]?.value ?? 1);
          if (account.is_cash_flow) {
            cashFlow +=
              account.starting_balance /
              Math.pow(10, account.currency.decimal_digits) /
              (data.currencyRates?.[account.currency.code]?.value ?? 1);
          }
        });
      data.transactions
        ?.filter(
          (transaction) =>
            dateStart <= new Date(transaction.timestamp).getTime() &&
            new Date(transaction.timestamp).getTime() < dateEnd,
        )
        .forEach((transaction) => {
          transaction.transaction_items.forEach((t) => {
            const amount =
              t.amount /
              Math.pow(10, t.account.currency.decimal_digits) /
              (data.currencyRates?.[t.account.currency.code]?.value ?? 1);
            if (t.category) {
              categories[t.category.name] =
                (categories[t.category.name] ?? 0) + amount;
            }
            wealth += amount;
            if (t.account.is_cash_flow) {
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

    const allCategories =
      data.categories?.map(
        (category) =>
          [
            category.name,
            category.group,
            categories[category.name] ?? 0,
          ] as const,
      ) ?? [];

    const maxCategoryValue = Math.max(
      ...Object.values(categories).map(Math.abs),
    );

    return {
      wealthData,
      categories: Object.entries(categories).sort((a, b) => {
        if (a[0] < b[0]) return -1;
        if (a[0] > b[0]) return 1;
        return 0;
      }),
      allCategories,
      maxCategoryValue,
    };
  }, [monthAndYear, data]);

  const previousMonthChartData = useMemo(() => {
    const daysInMonth = [];
    daysInMonth.push();
    const date = new Date(
      Date.UTC(previousMonthAndYear.year, previousMonthAndYear.month, 1),
    );
    const firstDay = date.getTime();
    while (date.getUTCMonth() === previousMonthAndYear.month) {
      daysInMonth.push(new Date(date));
      date.setDate(date.getUTCDate() + 1);
    }

    let cumulative = 0;
    let cashFlowCumulative = 0;
    const categories: { [key: string]: number } = {};
    data.accounts
      ?.filter((account) => new Date(account.created_at).getTime() < firstDay)
      .forEach((account) => {
        cumulative +=
          account.starting_balance /
          Math.pow(10, account.currency.decimal_digits) /
          (data.currencyRates?.[account.currency.code]?.value ?? 1);
        if (account.is_cash_flow) {
          cashFlowCumulative +=
            account.starting_balance /
            Math.pow(10, account.currency.decimal_digits) /
            (data.currencyRates?.[account.currency.code]?.value ?? 1);
        }
      });
    data.transactions
      ?.filter(
        (transaction) => new Date(transaction.timestamp).getTime() < firstDay,
      )
      .forEach((transaction) => {
        transaction.transaction_items.forEach((t) => {
          cumulative +=
            t.amount /
            Math.pow(10, t.account.currency.decimal_digits) /
            (data.currencyRates?.[t.account.currency.code]?.value ?? 1);
          if (t.account.is_cash_flow) {
            cashFlowCumulative +=
              t.amount /
              Math.pow(10, t.account.currency.decimal_digits) /
              (data.currencyRates?.[t.account.currency.code]?.value ?? 1);
          }
        });
      });

    const wealthData = daysInMonth.map((d) => {
      const dateStart = d.getTime();
      const dateEnd = dateStart + 24 * 60 * 60 * 1000;
      let wealth = 0;
      let cashFlow = 0;
      data.accounts
        ?.filter(
          (account) =>
            dateStart <= new Date(account.created_at).getTime() &&
            new Date(account.created_at).getTime() < dateEnd,
        )
        .forEach((account) => {
          wealth +=
            account.starting_balance /
            Math.pow(10, account.currency.decimal_digits) /
            (data.currencyRates?.[account.currency.code]?.value ?? 1);
          if (account.is_cash_flow) {
            cashFlow +=
              account.starting_balance /
              Math.pow(10, account.currency.decimal_digits) /
              (data.currencyRates?.[account.currency.code]?.value ?? 1);
          }
        });
      data.transactions
        ?.filter(
          (transaction) =>
            dateStart <= new Date(transaction.timestamp).getTime() &&
            new Date(transaction.timestamp).getTime() < dateEnd,
        )
        .forEach((transaction) => {
          transaction.transaction_items.forEach((t) => {
            const amount =
              t.amount /
              Math.pow(10, t.account.currency.decimal_digits) /
              (data.currencyRates?.[t.account.currency.code]?.value ?? 1);
            if (t.category) {
              categories[t.category.name] =
                (categories[t.category.name] ?? 0) + amount;
            }
            wealth += amount;
            if (t.account.is_cash_flow) {
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

    const allCategories =
      data.categories?.map(
        (category) =>
          [
            category.name,
            category.group,
            categories[category.name] ?? 0,
          ] as const,
      ) ?? [];

    const maxCategoryValue = Math.max(
      ...Object.values(categories).map(Math.abs),
    );

    return {
      wealthData,
      categories: Object.entries(categories).sort((a, b) => {
        if (a[0] < b[0]) return -1;
        if (a[0] > b[0]) return 1;
        return 0;
      }),
      allCategories,
      maxCategoryValue,
    };
  }, [previousMonthAndYear, data]);

  if (isPending) return "Loading...";

  if (errors.length)
    return (
      <div>
        Error occurred:
        {errors.map((error, i) => (
          <div key={i}>{error.message}</div>
        ))}
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex">
        <h1 className="grow text-xl font-bold">Dashboard</h1>
        <div>
          <Select value={currentCurrency} onValueChange={(e) => setCurrency(e)}>
            <SelectTrigger>
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              {currenciesToShow.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <h2 className="text-center text-lg font-bold">Total wealth</h2>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <div className="bg-accent shadow-xs p-2 text-2xl">
          <CurrencyDisplay
            value={
              wealth *
              (data.currencyRates?.[currentCurrency]?.value ?? 1) *
              Math.pow(10, currentCurrencyData?.decimal_digits ?? 0)
            }
            currencyCode={currentCurrency}
            decimalDigits={currentCurrencyData?.decimal_digits ?? 0}
          />
        </div>
      </div>
      <div className="m-4 flex flex-col items-center gap-4">
        <h2 className="text-center text-lg font-bold">
          Wealth chart ({currentCurrency}) for{" "}
          {Intl.DateTimeFormat("en", {
            month: "long",
            year: "numeric",
          }).format(new Date(monthAndYear.year, monthAndYear.month))}
        </h2>
        <div className="flex gap-4">
          <Select
            value={String(monthAndYear.month)}
            onValueChange={(e) =>
              setMonthAndYear({
                ...monthAndYear,
                month: Number(e),
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i).map((i) => (
                <SelectItem key={i} value={String(i)}>
                  {Intl.DateTimeFormat("en", { month: "short" }).format(
                    new Date(0, i),
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            value={monthAndYear.year}
            onChange={(e) =>
              setMonthAndYear({
                ...monthAndYear,
                year: Number(e.target.value),
              })
            }
          />
        </div>
        <div className="flex w-full flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Wealth</CardTitle>
              <CardDescription>
                {Intl.DateTimeFormat("en", {
                  month: "long",
                  year: "numeric",
                }).format(new Date(monthAndYear.year, monthAndYear.month))}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  desktop: {
                    label: "Wealth",
                    color: "var(--color-primary)",
                  },
                }}
              >
                <LineChart
                  accessibilityLayer
                  data={chartData.wealthData.map(
                    ({ date, wealth, cashFlow }) => ({
                      date,
                      wealth:
                        wealth *
                        (data.currencyRates?.[currentCurrency]?.value ?? 1),
                      cashFlow:
                        cashFlow *
                        (data.currencyRates?.[currentCurrency]?.value ?? 1),
                    }),
                  )}
                  margin={{
                    left: 12,
                    right: 12,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                    labelFormatter={(value) => {
                      return Intl.DateTimeFormat("en", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }).format(
                        new Date(
                          monthAndYear.year,
                          monthAndYear.month,
                          Number(value),
                        ),
                      );
                    }}
                    formatter={(value) => {
                      return Intl.NumberFormat("en", {
                        currency: currentCurrency,
                        style: "currency",
                      }).format(Number(value));
                    }}
                  />
                  <Line
                    dataKey="wealth"
                    type="natural"
                    stroke="var(--color-desktop)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
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
                }).format(new Date(monthAndYear.year, monthAndYear.month))}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  desktop: {
                    label: "Wealth",
                    color: "var(--color-primary)",
                  },
                }}
              >
                <LineChart
                  accessibilityLayer
                  data={chartData.wealthData.map(
                    ({ date, wealth, cashFlow }) => ({
                      date,
                      wealth:
                        wealth *
                        (data.currencyRates?.[currentCurrency]?.value ?? 1),
                      cashFlow:
                        cashFlow *
                        (data.currencyRates?.[currentCurrency]?.value ?? 1),
                    }),
                  )}
                  margin={{
                    left: 12,
                    right: 12,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                    labelFormatter={(value) => {
                      return Intl.DateTimeFormat("en", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }).format(
                        new Date(
                          monthAndYear.year,
                          monthAndYear.month,
                          Number(value),
                        ),
                      );
                    }}
                    formatter={(value) => {
                      return Intl.NumberFormat("en", {
                        currency: currentCurrency,
                        style: "currency",
                      }).format(Number(value));
                    }}
                  />
                  <Line
                    dataKey="cashFlow"
                    type="natural"
                    stroke="var(--color-green-900)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
            <CardFooter>Cumulative cash flow over the month</CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Categories Table</CardTitle>
              <CardDescription>
                {Intl.DateTimeFormat("en", {
                  month: "long",
                  year: "numeric",
                }).format(new Date(monthAndYear.year, monthAndYear.month))}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">
                      Amount (Previous month)
                    </TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chartData.allCategories.map(
                    ([name, group, value], index) => (
                      <TableRow key={name}>
                        <TableCell>
                          {name} {group && `(${group})`}
                        </TableCell>
                        <TableCell className="text-right">
                          {previousMonthChartData.allCategories[index]?.[0] !==
                            name && "Error"}
                          <CurrencyDisplay
                            value={
                              (previousMonthChartData.allCategories[
                                index
                              ]?.[2] ?? 0) *
                              (data.currencyRates?.[currentCurrency]?.value ??
                                1) *
                              Math.pow(
                                10,
                                currentCurrencyData?.decimal_digits ?? 0,
                              )
                            }
                            currencyCode={currentCurrency}
                            decimalDigits={
                              currentCurrencyData?.decimal_digits ?? 0
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <CurrencyDisplay
                            value={
                              value *
                              (data.currencyRates?.[currentCurrency]?.value ??
                                1) *
                              Math.pow(
                                10,
                                currentCurrencyData?.decimal_digits ?? 0,
                              )
                            }
                            currencyCode={currentCurrency}
                            decimalDigits={
                              currentCurrencyData?.decimal_digits ?? 0
                            }
                          />
                        </TableCell>
                        <TableCell className="w-1/6">
                          <Progress
                            value={
                              Math.abs(value * 100) / chartData.maxCategoryValue
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                  <TableRow>
                    <TableCell className="font-semibold">Total</TableCell>
                    <TableCell className="text-right font-semibold">
                      <CurrencyDisplay
                        value={
                          previousMonthChartData.allCategories.reduce(
                            (acc, [, , value]) => acc + value,
                            0,
                          ) *
                          (data.currencyRates?.[currentCurrency]?.value ?? 1) *
                          Math.pow(10, currentCurrencyData?.decimal_digits ?? 0)
                        }
                        currencyCode={currentCurrency}
                        decimalDigits={currentCurrencyData?.decimal_digits ?? 0}
                      />
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      <CurrencyDisplay
                        value={
                          chartData.allCategories.reduce(
                            (acc, [, , value]) => acc + value,
                            0,
                          ) *
                          (data.currencyRates?.[currentCurrency]?.value ?? 1) *
                          Math.pow(10, currentCurrencyData?.decimal_digits ?? 0)
                        }
                        currencyCode={currentCurrency}
                        decimalDigits={currentCurrencyData?.decimal_digits ?? 0}
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
      </div>
    </div>
  );
}
