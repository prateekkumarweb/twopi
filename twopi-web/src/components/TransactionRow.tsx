import { Link } from "@tanstack/react-router";
import dayjs from "dayjs";
import { DynamicIcon } from "lucide-react/dynamic";
import type { HTMLProps } from "react";
import type { getTransaction } from "~/lib/server-fns/transaction";
import CurrencyDisplay from "./CurrencyDisplay";
import { Badge } from "./ui/badge";

type Transaction = Awaited<ReturnType<typeof getTransaction>>;

export default function TransactionRow({
  transaction,
}: {
  transaction: Transaction;
  className?: HTMLProps<HTMLElement>["className"];
}) {
  return (
    <div className="border-1 rounded-2xl p-3">
      <Link
        to="/app/transaction/$id"
        params={{ id: transaction.id }}
        className="flex flex-col gap-2"
      >
        <div className="flex gap-2">
          <h2 className="grow overflow-hidden text-ellipsis text-nowrap">
            {transaction.title}
          </h2>
          <div className="flex gap-2 text-sm text-zinc-700">
            {dayjs(transaction.timestamp).format("h:mm A")}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {transaction.transaction_items?.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <div className="grow overflow-hidden text-ellipsis text-nowrap text-sm text-gray-500">
                {item.category && (
                  <Badge variant="secondary" className="mr-2">
                    {item.category.icon && (
                      <DynamicIcon
                        name={item.category.icon as "loader"}
                        className="inline-block h-4 w-4"
                      />
                    )}
                    {item.category.name}
                  </Badge>
                )}
                {item.notes}
              </div>
              <Badge variant="outline">{item.account.name}</Badge>
              <Badge
                className={
                  item.amount < 0
                    ? "bg-red-900"
                    : item.amount > 0
                      ? "bg-green-900"
                      : ""
                }
              >
                <CurrencyDisplay
                  value={item.amount}
                  currencyCode={item.account.currency.code}
                  decimalDigits={item.account.currency.decimal_digits}
                />
              </Badge>
            </div>
          ))}
        </div>
      </Link>
    </div>
  );
}
