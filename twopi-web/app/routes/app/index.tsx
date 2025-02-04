import { useQueries } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import clsx from "clsx";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
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
  const wealthInUSD = wealth;
  const wealthInINR = wealth * (data.currencyRates?.INR?.value ?? 1);
  const wealthInEUR = wealth * (data.currencyRates?.EUR?.value ?? 1);
  const wealthInGBP = wealth * (data.currencyRates?.GBP?.value ?? 1);
  const wealthInJPY = wealth * (data.currencyRates?.JPY?.value ?? 1);
  const wealthInAED = wealth * (data.currencyRates?.AED?.value ?? 1);

  const chartData = useMemo(() => {
    const daysInMonth = [];
    daysInMonth.push();
    const date = new Date(Date.UTC(monthAndYear.year, monthAndYear.month, 1));
    while (date.getUTCMonth() === monthAndYear.month) {
      daysInMonth.push(new Date(date));
      date.setDate(date.getUTCDate() + 1);
    }

    let cummulative = 0;

    return daysInMonth.map((d) => {
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
      cummulative += wealth;
      return {
        date: `${d.getUTCDate()}`,
        todaysWealth: wealth,
        wealth: cummulative,
      };
    });
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
    <div className="flex flex-col gap-4 bg-base-100 p-4 shadow-sm">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <h2 className="text-center text-lg font-bold">Total wealth</h2>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <div
          className={clsx(
            "bg-base-200 p-4 text-3xl shadow-sm",
            wealth > 0
              ? "bg-success text-success-content"
              : wealth < 0
                ? "bg-error text-error-content"
                : "bg-neutral text-neutral-content",
          )}
        >
          {new Intl.NumberFormat("en", {
            style: "currency",
            currency: "USD",
          }).format(wealthInUSD)}
        </div>
        <div
          className={clsx(
            "bg-base-200 p-4 text-3xl shadow-sm",
            wealth > 0
              ? "bg-success text-success-content"
              : wealth < 0
                ? "bg-error text-error-content"
                : "bg-neutral text-neutral-content",
          )}
        >
          {new Intl.NumberFormat("en", {
            style: "currency",
            currency: "INR",
          }).format(wealthInINR)}
        </div>
        <div
          className={clsx(
            "bg-base-200 p-4 text-3xl shadow-sm",
            wealth > 0
              ? "bg-success text-success-content"
              : wealth < 0
                ? "bg-error text-error-content"
                : "bg-neutral text-neutral-content",
          )}
        >
          {new Intl.NumberFormat("en", {
            style: "currency",
            currency: "EUR",
          }).format(wealthInEUR)}
        </div>
        <div
          className={clsx(
            "bg-base-200 p-4 text-3xl shadow-sm",
            wealth > 0
              ? "bg-success text-success-content"
              : wealth < 0
                ? "bg-error text-error-content"
                : "bg-neutral text-neutral-content",
          )}
        >
          {new Intl.NumberFormat("en", {
            style: "currency",
            currency: "GBP",
          }).format(wealthInGBP)}
        </div>
        <div
          className={clsx(
            "bg-base-200 p-4 text-3xl shadow-sm",
            wealth > 0
              ? "bg-success text-success-content"
              : wealth < 0
                ? "bg-error text-error-content"
                : "bg-neutral text-neutral-content",
          )}
        >
          {new Intl.NumberFormat("en", {
            style: "currency",
            currency: "JPY",
          }).format(wealthInJPY)}
        </div>
        <div
          className={clsx(
            "bg-base-200 p-4 text-3xl shadow-sm",
            wealth > 0
              ? "bg-success text-success-content"
              : wealth < 0
                ? "bg-error text-error-content"
                : "bg-neutral text-neutral-content",
          )}
        >
          {new Intl.NumberFormat("en", {
            style: "currency",
            currency: "AED",
          }).format(wealthInAED)}
        </div>
      </div>
      <div className="m-4 flex flex-col items-center gap-4">
        <h2 className="text-center text-lg font-bold">
          Wealth chart (USD) for{" "}
          {Intl.DateTimeFormat("en", {
            month: "long",
            year: "numeric",
          }).format(today)}
        </h2>
        <div className="flex gap-4">
          <select
            value={monthAndYear.month}
            onChange={(e) =>
              setMonthAndYear({
                ...monthAndYear,
                month: Number(e.target.value),
              })
            }
          >
            <option value="0">Jan</option>
            <option value="1">Feb</option>
            <option value="2">Mar</option>
            <option value="3">Apr</option>
            <option value="4">May</option>
            <option value="5">Jun</option>
            <option value="6">Jul</option>
            <option value="7">Aug</option>
            <option value="8">Sep</option>
            <option value="9">Oct</option>
            <option value="10">Nov</option>
            <option value="11">Dec</option>
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
          <LineChart data={chartData}>
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
                    currency: "USD",
                    style: "currency",
                  }).format(Number(value)),
                ];
              }}
            />
            <XAxis dataKey="date" />
            <YAxis />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
