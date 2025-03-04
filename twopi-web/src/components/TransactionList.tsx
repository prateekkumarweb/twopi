import dayjs from "dayjs";
import type { getTransaction } from "~/lib/server-fns/transaction";
import TransactionRow from "./TransactionRow";

type Transaction = Awaited<ReturnType<typeof getTransaction>>;

export default function TransactionList(props: {
  transactions: Transaction[];
}) {
  const transactions = Object.entries(
    Object.groupBy(props.transactions, (transaction) =>
      dayjs(transaction.timestamp).format("YYYY-MM-DD"),
    ),
  ).sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <div className="my-2 flex flex-col gap-3">
      {transactions.length === 0 && <div>No transactions found</div>}
      {transactions.map(([date, txs]) => (
        <div key={date} className="flex flex-col gap-1">
          <div className="font-light text-zinc-700">
            {dayjs(date).format("MMM D, YYYY")}
          </div>
          {txs?.map((transaction) => (
            <TransactionRow transaction={transaction} key={transaction.id} />
          ))}
        </div>
      ))}
    </div>
  );
}
