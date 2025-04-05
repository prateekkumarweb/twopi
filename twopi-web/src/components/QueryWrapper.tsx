import type { UseQueryResult } from "@tanstack/solid-query";
import { Loader } from "lucide-solid";
import { Match, Show, Switch, type JSX } from "solid-js";

export default function QueryWrapper<T, E>(
  props: Readonly<{
    children: (data: T) => JSX.Element;
    queryResult: UseQueryResult<T, E>;
    errorRender: (error: E) => JSX.Element;
  }>,
) {
  return (
    <Switch>
      <Match when={props.queryResult.isLoading}>
        <div>
          <Loader />
        </div>
      </Match>
      <Match when={props.queryResult.isError}>
        <Show when={props.queryResult.error}>
          {(e) => props.errorRender(e())}
        </Show>
      </Match>
      <Match when={props.queryResult.isSuccess}>
        <Show when={props.queryResult.data}>
          {(data) => props.children(data())}
        </Show>
      </Match>
    </Switch>
  );
}
