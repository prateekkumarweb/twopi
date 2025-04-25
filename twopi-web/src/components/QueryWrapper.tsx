import type { UseQueryResult } from "@tanstack/solid-query";
import { LucideLoader } from "lucide-solid";
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
          <LucideLoader />
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

export function QueriesWrapper<T1, T2, E>(
  props: Readonly<{
    children: (data: [T1, T2]) => JSX.Element;
    queryResults: [UseQueryResult<T1, E>, UseQueryResult<T2, E>];
    errorRender: (error: E) => JSX.Element;
  }>,
) {
  return (
    <Switch>
      <Match when={props.queryResults.some((r) => r.isLoading)}>
        <div>
          <LucideLoader />
        </div>
      </Match>
      <Match when={props.queryResults.some((r) => r.isError)}>
        <Show when={props.queryResults.find((r) => r.isError)}>
          {(e) => props.errorRender(e().error)}
        </Show>
      </Match>
      <Match when={props.queryResults.every((r) => r.isSuccess)}>
        <Show when={props.queryResults.every((r) => r.data)}>
          {props.children([
            props.queryResults[0].data!,
            props.queryResults[1].data!,
          ])}
        </Show>
      </Match>
    </Switch>
  );
}
