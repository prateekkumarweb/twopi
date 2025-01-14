import { useQueries } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
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
          currencyRates: results[2].data,
        },
        isPending: results.some((result) => result.isPending),
        errors: results.map((result) => result.error).filter(isDefined),
      };
    },
  });

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

  let wealth = 0;
  data.accounts?.forEach((account) => {
    wealth +=
      account.startingBalance /
      (data.currencyRates?.[account.currencyCode].value ?? 1);
  });
  data.transactions?.forEach((transaction) => {
    transaction.transactions.forEach((t) => {
      wealth +=
        t.amount / (data.currencyRates?.[t.account.currencyCode].value ?? 1);
      console.log(wealth);
    });
  });
  const wealthInUSD = wealth;
  const wealthInINR = wealth * (data.currencyRates?.INR.value ?? 1);
  const wealthInEUR = wealth * (data.currencyRates?.EUR.value ?? 1);
  const wealthInGBP = wealth * (data.currencyRates?.GBP.value ?? 1);
  const wealthInJPY = wealth * (data.currencyRates?.JPY.value ?? 1);
  const wealthInAED = wealth * (data.currencyRates?.AED.value ?? 1);

  return (
    <div className="d-card bg-base-100 shadow-sm">
      <div className="d-card-body">
        <h2 className="d-card-title">Total wealth</h2>
        <div className="flex flex-wrap gap-4">
          <div className="bg-base-200 p-4 text-3xl shadow-sm">
            {new Intl.NumberFormat("en", {
              style: "currency",
              currency: "USD",
            }).format(wealthInUSD)}
          </div>
          <div className="bg-base-200 p-4 text-3xl shadow-sm">
            {new Intl.NumberFormat("en", {
              style: "currency",
              currency: "INR",
            }).format(wealthInINR)}
          </div>
          <div className="bg-base-200 p-4 text-3xl shadow-sm">
            {new Intl.NumberFormat("en", {
              style: "currency",
              currency: "EUR",
            }).format(wealthInEUR)}
          </div>
          <div className="bg-base-200 p-4 text-3xl shadow-sm">
            {new Intl.NumberFormat("en", {
              style: "currency",
              currency: "GBP",
            }).format(wealthInGBP)}
          </div>
          <div className="bg-base-200 p-4 text-3xl shadow-sm">
            {new Intl.NumberFormat("en", {
              style: "currency",
              currency: "JPY",
            }).format(wealthInJPY)}
          </div>
          <div className="bg-base-200 p-4 text-3xl shadow-sm">
            {new Intl.NumberFormat("en", {
              style: "currency",
              currency: "AED",
            }).format(wealthInAED)}
          </div>
        </div>
      </div>
    </div>
  );
}
