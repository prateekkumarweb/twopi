import { useQuery } from "@tanstack/solid-query";
import { Link } from "@tanstack/solid-router";
import dayjs from "dayjs";
import { For, Show } from "solid-js";
import { type getTransaction } from "~/lib/api/transaction";
import type { AccountTypeOrigin } from "~/lib/hacks/account-type";
import { accountQueryOptions, categoryQueryOptions } from "~/lib/query-options";
import { AccountTypeIcon } from "./AccountTypeIcon";
import CurrencyDisplay from "./CurrencyDisplay";
import DynamicIcon from "./DynamicIcon";
import { Badge } from "./ui/badge";

type Transaction = Awaited<ReturnType<typeof getTransaction>>;

export default function TransactionRow(
  props: Readonly<{ transaction: Transaction }>,
) {
  const accountsQuery = useQuery(accountQueryOptions);
  const categoriesQuery = useQuery(categoryQueryOptions);
  const account = (id: string) =>
    accountsQuery.data?.accounts.find((account) => account.account.id === id);
  const category = (id?: string | null) =>
    categoriesQuery.data?.categories.find((category) => category.id === id);

  return (
    <div class="border-1 rounded-2xl p-3">
      <Link
        to="/app/finance/transaction/$id"
        params={{ id: props.transaction.transaction.id }}
        class="flex flex-col gap-2"
      >
        <div class="flex gap-2">
          <h2 class="grow overflow-hidden text-ellipsis text-nowrap">
            {props.transaction.transaction.title}
          </h2>
          <div class="flex gap-2 text-sm text-zinc-700">
            {dayjs(props.transaction.transaction.timestamp).format("h:mm A")}
          </div>
        </div>
        <div class="flex flex-col gap-2">
          {
            <For each={props.transaction.items}>
              {(item) => (
                <div class="flex items-center gap-2">
                  <div class="grow overflow-hidden text-ellipsis text-nowrap text-sm text-gray-500">
                    <Show when={category(item.category_id)}>
                      {(category) => (
                        <Badge variant="secondary" class="mr-2">
                          {item.category_id && (
                            <DynamicIcon
                              name={category().icon as "Loader"}
                              class="inline-block h-4 w-4"
                            />
                          )}
                          {category().name}
                        </Badge>
                      )}
                    </Show>

                    {item.notes}
                  </div>
                  <Badge variant="outline">
                    <Show when={account(item.account_id)}>
                      {(account) => (
                        <AccountTypeIcon
                          type={
                            account().account.account_type as AccountTypeOrigin
                          }
                        />
                      )}
                    </Show>
                    {account(item.account_id)?.account.name}
                  </Badge>
                  <Badge
                    class={
                      item.amount < 0
                        ? "border-red-600 bg-red-200 text-red-900"
                        : item.amount > 0
                          ? "border-green-600 bg-green-200 text-green-900"
                          : "border-gray-600 bg-gray-200 text-gray-900"
                    }
                  >
                    <Show when={account(item.account_id)}>
                      {(account) => (
                        <CurrencyDisplay
                          value={item.amount}
                          currencyCode={account().currency.code}
                          decimalDigits={account().currency.decimal_digits}
                        />
                      )}
                    </Show>
                  </Badge>
                </div>
              )}
            </For>
          }
        </div>
      </Link>
    </div>
  );
}
