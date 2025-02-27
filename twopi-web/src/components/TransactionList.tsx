import dayjs from "dayjs";
import { Fragment } from "react";
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
  );

  return (
    <div className="my-2 flex flex-col gap-2">
      {transactions.length === 0 && <div>No transactions found</div>}
      {transactions.map(([date, txs]) => (
        <Fragment key={date}>
          <div className="font-extralight">
            {dayjs(date).format("MMM D, YYYY")}
          </div>
          {txs?.map((transaction) => (
            <Fragment key={transaction.id}>
              <TransactionRow
                transaction={transaction}
                className="rounded-2xl border-2 p-3"
              />
            </Fragment>
          ))}
        </Fragment>
      ))}
    </div>
  );
}
