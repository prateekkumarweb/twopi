import { Link } from "@tanstack/react-router";
import dayjs from "dayjs";
import type { getTransaction } from "~/lib/server-fns/transaction";
import { Badge } from "./ui/badge";

type Transaction = Awaited<ReturnType<typeof getTransaction>>;

export default function TransactionRow({
  transaction,
}: {
  transaction: Transaction;
}) {
  return (
    <div>
      <Link
        to="/app/transaction/$id"
        params={{ id: transaction.id }}
        className="flex flex-col gap-2"
      >
        <div className="flex gap-2">
          <h2 className="grow overflow-hidden text-ellipsis text-nowrap">
            {transaction.title}
          </h2>
          <div className="flex gap-2">
            <Badge variant="outline">
              {dayjs(transaction.timestamp).format("MMM D, YYYY h:mm A")}
            </Badge>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {transaction.transaction_items?.map((item) => (
            <div key={item.id} className="flex w-full items-center gap-2">
              <div className="grow overflow-hidden text-ellipsis text-nowrap text-sm text-gray-500">
                {item.notes}
              </div>
              <Badge variant="outline">{item.account.name}</Badge>
              <Badge>
                {Intl.NumberFormat("en", {
                  style: "currency",
                  currency: item.account.currency.code,
                }).format(item.amount)}
              </Badge>
              {item.category && (
                <Badge variant="secondary">{item.category.name}</Badge>
              )}
            </div>
          ))}
        </div>
      </Link>
    </div>
  );
}
