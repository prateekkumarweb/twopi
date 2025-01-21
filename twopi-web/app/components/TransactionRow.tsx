import dayjs from "dayjs";
import type { getTransaction } from "~/lib/server-fns/transaction";

type Transaction = Awaited<ReturnType<typeof getTransaction>>;

export default function TransactionRow({
  transaction,
}: {
  transaction: Transaction;
}) {
  return (
    <div className="bg-base-100 flex flex-col gap-2 p-2 shadow-sm">
      <div className="flex gap-2">
        <h2 className="grow text-ellipsis text-nowrap">{transaction.name}</h2>
        <div className="flex gap-2">
          <div className="d-badge d-badge-sm d-badge-ghost text-nowrap">
            {dayjs(transaction.timestamp).format("MMM D, YYYY h:mm A")}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {transaction.transactions?.map((item) => (
          <div key={item.id} className="flex w-full items-center gap-2">
            <div className="grow text-sm text-gray-500">{item.notes}</div>
            <div className="d-badge d-badge-sm d-badge-primary">
              {item.account.name}
            </div>
            <div className="d-badge d-badge-sm d-badge-neutral">
              {Intl.NumberFormat("en", {
                style: "currency",
                currency: item.account.currencyCode,
              }).format(item.amount)}
            </div>
            {item.categoryName && (
              <div className="d-badge d-badge-sm d-badge-info">
                {item.categoryName}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
