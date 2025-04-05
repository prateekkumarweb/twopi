import type { JSX } from "solid-js";

export default function LabelAndValue(
  props: Readonly<{
    label: string;
    value: JSX.Element;
  }>,
) {
  return (
    <div class="flex flex-nowrap items-center gap-2">
      <div class="grow font-light">{props.label}</div>
      <div class="overflow-hidden text-ellipsis text-nowrap text-sm text-gray-700">
        {props.value}
      </div>
    </div>
  );
}
