import { useQueries } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis } from "recharts";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  accountQueryOptions,
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
    ],
    combine: (results) => {
      return {
        data: {
          accounts: results[0].data?.accounts,
          transactions: results[1].data?.transactions,
          currencyRates: results[2].data?.data,
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
  const [currentCurrency, setCurrency] = useState("USD");
  const currenciesToShow = ["USD", "INR", "AED", "CNY", "EUR", "GBP", "JPY"];

  let wealth = 0;
  data.accounts?.forEach((account) => {
    wealth +=
      account.starting_balance /
      (data.currencyRates?.[account.currency.code]?.value ?? 1);
  });
  data.transactions?.forEach((transaction) => {
    transaction.transaction_items.forEach((t) => {
      wealth +=
        t.amount / (data.currencyRates?.[t.account.currency.code]?.value ?? 1);
    });
  });
  const wealthInDifferentCurrencies = currenciesToShow.map((currency) => {
    return {
      currency,
      value: wealth * (data.currencyRates?.[currency]?.value ?? 1),
    };
  });

  const chartData = useMemo(() => {
    const daysInMonth = [];
    daysInMonth.push();
    const date = new Date(Date.UTC(monthAndYear.year, monthAndYear.month, 1));
    while (date.getUTCMonth() === monthAndYear.month) {
      daysInMonth.push(new Date(date));
      date.setDate(date.getUTCDate() + 1);
    }

    let cummulative = 0;
    const categories: { [key: string]: number } = {};

    const wealthData = daysInMonth.map((d) => {
      const dateStart = d.getTime();
      const dateEnd = dateStart + 24 * 60 * 60 * 1000;
      let wealth = 0;
      data.accounts
        ?.filter(
          (account) =>
            dateStart <= new Date(account.created_at).getTime() &&
            new Date(account.created_at).getTime() < dateEnd,
        )
        .forEach((account) => {
          wealth +=
            account.starting_balance /
            (data.currencyRates?.[account.currency.code]?.value ?? 1);
        });
      data.transactions
        ?.filter(
          (transaction) =>
            dateStart <= new Date(transaction.timestamp).getTime() &&
            new Date(transaction.timestamp).getTime() < dateEnd,
        )
        .forEach((transaction) => {
          transaction.transaction_items.forEach((t) => {
            wealth +=
              t.amount /
              (data.currencyRates?.[t.account.currency.code]?.value ?? 1);
          });
        });

      data.transactions
        ?.filter(
          (transaction) =>
            dateStart <= new Date(transaction.timestamp).getTime() &&
            new Date(transaction.timestamp).getTime() < dateEnd,
        )
        .forEach((transaction) => {
          transaction.transaction_items.forEach((t) => {
            if (t.category) {
              categories[t.category.name] =
                (categories[t.category.name] ?? 0) +
                t.amount /
                  (data.currencyRates?.[t.account.currency.code]?.value ?? 1);
            }
          });
        });
      cummulative += wealth;
      return {
        date: `${d.getUTCDate()}`,
        wealth: cummulative,
      };
    });

    return {
      wealthData,
      categories: Object.entries(categories).sort((a, b) => {
        if (a[0] < b[0]) return -1;
        if (a[0] > b[0]) return 1;
        return 0;
      }),
    };
  }, [monthAndYear, data]);

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
      <h1 className="text-xl font-bold">Dashboard</h1>
      <h2 className="text-center text-lg font-bold">Total wealth</h2>
      <div className="flex flex-wrap items-center justify-center gap-4">
        {wealthInDifferentCurrencies.map((wealth) => (
          <div
            key={wealth.currency}
            className="bg-accent shadow-xs p-2 text-2xl"
          >
            {new Intl.NumberFormat("en", {
              style: "currency",
              currency: wealth.currency,
            }).format(wealth.value)}
          </div>
        ))}
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
                  data={chartData.wealthData.map(({ date, wealth }) => ({
                    date,
                    wealth:
                      wealth *
                      (data.currencyRates?.[currentCurrency]?.value ?? 1),
                  }))}
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
              <CardTitle>Categories</CardTitle>
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
                    label: "Category",
                    color: "var(--color-primary)",
                  },
                }}
              >
                <BarChart
                  accessibilityLayer
                  data={chartData.categories.map(([name, value]) => ({
                    name,
                    value:
                      value *
                      (data.currencyRates?.[currentCurrency]?.value ?? 1),
                  }))}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                    formatter={(value) => {
                      return Intl.NumberFormat("en", {
                        currency: currentCurrency,
                        style: "currency",
                      }).format(Number(value));
                    }}
                  />
                  <Bar dataKey="value" fill="var(--color-desktop)" radius={8} />
                </BarChart>
              </ChartContainer>
            </CardContent>
            <CardFooter>Income/Expense in each category</CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
