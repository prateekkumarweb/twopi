import { useQueries } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import clsx from "clsx";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
    <div className="bg-base-100 flex flex-col gap-4 p-4 shadow-sm">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <h2 className="text-center text-lg font-bold">Total wealth</h2>
      <div className="flex flex-wrap items-center justify-center gap-4">
        {wealthInDifferentCurrencies.map((wealth) => (
          <div
            key={wealth.currency}
            className={clsx(
              "bg-base-200 p-2 text-2xl shadow-sm",
              wealth.value > 0
                ? "bg-success text-success-content"
                : wealth.value < 0
                  ? "bg-error text-error-content"
                  : "bg-neutral text-neutral-content",
            )}
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
          <select
            value={currentCurrency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {currenciesToShow.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
          <select
            value={monthAndYear.month}
            onChange={(e) =>
              setMonthAndYear({
                ...monthAndYear,
                month: Number(e.target.value),
              })
            }
          >
            {Array.from({ length: 12 }, (_, i) => i).map((i) => (
              <option key={i} value={i}>
                {Intl.DateTimeFormat("en", { month: "short" }).format(
                  new Date(0, i),
                )}
              </option>
            ))}
          </select>
          <input
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
        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={chartData.wealthData.map(({ date, wealth }) => ({
              date,
              wealth:
                wealth * (data.currencyRates?.[currentCurrency]?.value ?? 1),
            }))}
          >
            <Line type="monotone" dataKey="wealth" stroke="#8884d8" />
            <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
            <Tooltip
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
                return [
                  Intl.NumberFormat("en", {
                    currency: currentCurrency,
                    style: "currency",
                  }).format(Number(value)),
                ];
              }}
            />
            <XAxis dataKey="date" />
            <YAxis />
          </LineChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height={500}>
          <BarChart
            width={400}
            height={400}
            data={chartData.categories.map(([name, value]) => ({
              name,
              value:
                value * (data.currencyRates?.[currentCurrency]?.value ?? 1),
            }))}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              interval="preserveStartEnd"
              angle={270}
              textAnchor="end"
              height={150}
            />
            <YAxis />
            <Tooltip
              formatter={(value) => {
                return [
                  Intl.NumberFormat("en", {
                    currency: currentCurrency,
                    style: "currency",
                  }).format(Number(value)),
                ];
              }}
            />
            <Bar
              dataKey="value"
              fill="#8884d8"
              activeBar={<Rectangle fill="pink" stroke="blue" />}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
