import {
  Banknote,
  BookUser,
  CreditCard,
  HandCoins,
  Landmark,
  Wallet,
} from "lucide-solid";
import { Match, Switch } from "solid-js";
import type { AccountTypeOrigin } from "~/lib/hacks/account-type";

export function AccountTypeIcon(
  props: Readonly<{
    type: AccountTypeOrigin;
    class?: string;
  }>,
) {
  return (
    <Switch>
      <Match when={props.type === "Cash"}>
        <Banknote class={props.class} />
      </Match>
      <Match when={props.type === "Wallet"}>
        <Wallet class={props.class} />
      </Match>
      <Match when={props.type === "Bank"}>
        <Landmark class={props.class} />
      </Match>
      <Match when={props.type === "CreditCard"}>
        <CreditCard class={props.class} />
      </Match>
      <Match when={props.type === "Loan"}>
        <HandCoins class={props.class} />
      </Match>
      <Match when={props.type === "Person"}>
        <BookUser class={props.class} />
      </Match>
    </Switch>
  );
}
