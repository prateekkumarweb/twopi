import {
  LucideBanknote,
  LucideBookUser,
  LucideCreditCard,
  LucideHandCoins,
  LucideLandmark,
  LucideWallet,
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
        <LucideBanknote class={props.class} />
      </Match>
      <Match when={props.type === "Wallet"}>
        <LucideWallet class={props.class} />
      </Match>
      <Match when={props.type === "Bank"}>
        <LucideLandmark class={props.class} />
      </Match>
      <Match when={props.type === "CreditCard"}>
        <LucideCreditCard class={props.class} />
      </Match>
      <Match when={props.type === "Loan"}>
        <LucideHandCoins class={props.class} />
      </Match>
      <Match when={props.type === "Person"}>
        <LucideBookUser class={props.class} />
      </Match>
    </Switch>
  );
}
