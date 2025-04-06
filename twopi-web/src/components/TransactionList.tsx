import dayjs from "dayjs";
import { createMemo, For } from "solid-js";
import { type getTransaction } from "~/lib/api/transaction";
import TransactionRow from "./TransactionRow";

type Transaction = Awaited<ReturnType<typeof getTransaction>>;

export default function TransactionList(
  props: Readonly<{ transactions: Transaction[] }>,
) {
  const transactions = createMemo(() =>
    Object.entries(
      Object.groupBy(props.transactions, (transaction) =>
        dayjs(transaction.transaction.timestamp).format("YYYY-MM-DD"),
      ),
    ).toSorted((a, b) => b[0].localeCompare(a[0])),
  );

  return (
    <div class="my-2 flex flex-col gap-3">
      <For each={transactions()} fallback={<div>No transactions found.</div>}>
        {([date, txs]) => (
          <div class="flex flex-col gap-1">
            <div class="font-light text-zinc-700">
              {dayjs(date).format("MMM D, YYYY")}
            </div>
            {
              <For
                each={txs?.toSorted((a, b) =>
                  b.transaction.timestamp.localeCompare(
                    a.transaction.timestamp,
                  ),
                )}
              >
                {(transaction) => <TransactionRow transaction={transaction} />}
              </For>
            }
          </div>
        )}
      </For>
    </div>
  );
}
