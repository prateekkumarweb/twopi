import { Link } from "@tanstack/react-router";
import clsx from "clsx";
import dayjs from "dayjs";
import type { getTransaction } from "~/lib/server-fns/transaction";

type Transaction = Awaited<ReturnType<typeof getTransaction>>;

export default function TransactionRow({
  transaction,
}: {
  transaction: Transaction;
}) {
  return (
    <div className="bg-base-100 p-2 shadow-xs">
      <Link
        to="/app/transaction/$id"
        params={{ id: transaction.id }}
        className="flex flex-col gap-2"
      >
        <div className="flex gap-2">
          <h2 className="grow overflow-hidden text-nowrap text-ellipsis">
            {transaction.title}
          </h2>
          <div className="flex gap-2">
            <div className="d-badge d-badge-ghost d-badge-sm text-nowrap">
              {dayjs(transaction.timestamp).format("MMM D, YYYY h:mm A")}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {transaction.transaction_items?.map((item) => (
            <div key={item.id} className="flex w-full items-center gap-2">
              <div className="grow overflow-hidden text-sm text-nowrap text-ellipsis text-gray-500">
                {item.notes}
              </div>
              <div className="d-badge d-badge-sm text-nowrap d-badge-primary">
                {item.account.name}
              </div>
              <div
                className={clsx(
                  "d-badge d-badge-sm text-nowrap",
                  item.amount > 0
                    ? "d-badge-success"
                    : item.amount < 0
                      ? "d-badge-error"
                      : "d-badge-neutral",
                )}
              >
                {Intl.NumberFormat("en", {
                  style: "currency",
                  currency: item.account.currency.code,
                }).format(item.amount)}
              </div>
              {item.category && (
                <div className="d-badge d-badge-sm text-nowrap d-badge-info">
                  {item.category.name}
                </div>
              )}
            </div>
          ))}
        </div>
      </Link>
    </div>
  );
}
