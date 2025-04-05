import { createForm } from "@tanstack/solid-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/solid-query";
import { useNavigate } from "@tanstack/solid-router";
import dayjs from "dayjs";
import { createAccount } from "~/lib/api/account";
import { AccountType, type AccountTypeOrigin } from "~/lib/hacks/account-type";
import {
  accountByIdQueryOptions,
  accountQueryOptions,
  currencyQueryOptions,
} from "~/lib/query-options";
import CurrencyInput from "./CurrencyInput";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectHiddenSelect,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from "./ui/switch";

export default function AccountEditor(
  props: Readonly<{
    edit?: {
      id: string;
      name: string;
      accountType: AccountTypeOrigin;
      createdAt: Date;
      currencyCode: string;
      startingBalance: number;
      isCashFlow: boolean;
      isActive: boolean;
    };
  }>,
) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currenciesQuery = useQuery(currencyQueryOptions);

  const createdAt = new Date();
  createdAt.setMilliseconds(0);
  createdAt.setSeconds(0);
  const form = createForm(() => ({
    defaultValues: {
      id: props.edit?.id,
      name: props.edit?.name || "",
      accountType: (props.edit?.accountType ??
        "Bank") satisfies AccountTypeOrigin,
      createdAt: props.edit?.createdAt ?? createdAt,
      currencyCode: props.edit?.currencyCode ?? "",
      startingBalance: props.edit?.startingBalance ?? 0,
      isCashFlow: props.edit?.isCashFlow ?? false,
      isActive: props.edit?.isActive ?? true,
    },
    onSubmit: ({ value }) => {
      mutation.mutate(value);
    },
  }));
  const mutation = useMutation(() => ({
    mutationFn: async (data: {
      id?: string;
      name: string;
      accountType: AccountTypeOrigin;
      createdAt: Date;
      currencyCode: string;
      startingBalance: number;
      isCashFlow: boolean;
      isActive: boolean;
    }) => {
      createAccount(data);
      form.reset();
      navigate({
        to: "..",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          accountQueryOptions().queryKey,
          props.edit?.id
            ? accountByIdQueryOptions(props.edit.id).queryKey
            : undefined,
        ],
      });
    },
  }));

  return (
    <div class="w-full">
      <form
        class="my-2 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field name="name">
          {(field) => (
            <Input
              type="text"
              placeholder="Name"
              name={field().name}
              value={field().state.value}
              onBlur={field().handleBlur}
              onChange={(e) => field().handleChange(e.target.value)}
            />
          )}
        </form.Field>
        <form.Field name="accountType">
          {(field) => (
            <Select
              options={Object.values(AccountType)}
              value={field().state.value}
              placeholder="Select account type"
              onChange={(e) => field().handleChange(e as AccountTypeOrigin)}
              itemComponent={(props) => (
                <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
              )}
            >
              <SelectHiddenSelect />
              <SelectTrigger>
                <SelectValue<AccountTypeOrigin>>
                  {(state) => state.selectedOption()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent />
            </Select>
          )}
        </form.Field>
        <form.Field name="createdAt">
          {(field) => (
            <Input
              type="datetime-local"
              placeholder="Date/Time"
              name={field().name}
              value={dayjs(field().state.value).format("YYYY-MM-DDTHH:mm")}
              onBlur={field().handleBlur}
              onChange={(e) =>
                field().handleChange(dayjs(e.target.value).toDate())
              }
            />
          )}
        </form.Field>
        <form.Field name="currencyCode">
          {(field) => (
            <Select
              name={field().name}
              value={field().state.value}
              placeholder="Select currency"
              options={currenciesQuery.data?.data?.map((c) => c.code) ?? []}
              onChange={(e) => field().handleChange(e ?? "")}
              itemComponent={(props) => (
                <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
              )}
            >
              <SelectHiddenSelect />
              <SelectTrigger>
                <SelectValue<string>>
                  {(state) => state.selectedOption()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent />
            </Select>
          )}
        </form.Field>
        <form.Field name="startingBalance">
          {(field) => (
            <CurrencyInput
              name={field().name}
              value={field().state.value}
              placeholder="Starting Balance"
              onBlur={field().handleBlur}
              onChange={field().handleChange}
              currencyCode={
                currenciesQuery.data?.data?.find(
                  (c) => c.code === field().form.state.values.currencyCode,
                )?.code ?? ""
              }
              decimalDigits={
                currenciesQuery.data?.data?.find(
                  (c) => c.code === field().form.state.values.currencyCode,
                )?.decimal_digits ?? 0
              }
            />
          )}
        </form.Field>
        <form.Field name="isCashFlow">
          {(field) => (
            <div class="flex items-center justify-between">
              <Switch
                name={field().name}
                checked={field().state.value}
                onBlur={field().handleBlur}
                onChange={(checked) => field().handleChange(checked)}
                class="flex items-center gap-2"
              >
                <SwitchControl>
                  <SwitchThumb />
                </SwitchControl>
                <SwitchLabel>Cash flow</SwitchLabel>
              </Switch>
            </div>
          )}
        </form.Field>
        <form.Field name="isActive">
          {(field) => (
            <div class="flex items-center justify-between">
              <Switch
                name={field().name}
                checked={field().state.value}
                onBlur={field().handleBlur}
                onChange={(checked) => field().handleChange(checked)}
                class="flex items-center gap-2"
              >
                <SwitchControl>
                  <SwitchThumb />
                </SwitchControl>
                <SwitchLabel>Active</SwitchLabel>
              </Switch>
            </div>
          )}
        </form.Field>
        <Button type="submit" disabled={mutation.isPending}>
          {props.edit ? "Update" : "Create"}
        </Button>
        {mutation.isPending && <p class="text-accent">Creating...</p>}
        {mutation.isError && (
          <p class="text-destructive">{mutation.error?.message}</p>
        )}
      </form>
    </div>
  );
}
