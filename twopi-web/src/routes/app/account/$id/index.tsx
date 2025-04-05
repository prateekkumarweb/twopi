import { useMutation, useQuery, useQueryClient } from "@tanstack/solid-query";
import { createFileRoute, Link } from "@tanstack/solid-router";
import dayjs from "dayjs";
import { ArrowLeft, Edit, Trash } from "lucide-solid";
import CurrencyDisplay from "~/components/CurrencyDisplay";
import LabelAndValue from "~/components/LabelAndValue";
import { PageLayout } from "~/components/PageLayout";
import QueryWrapper from "~/components/QueryWrapper";
import { Badge } from "~/components/ui/badge";
import { Button, buttonVariants } from "~/components/ui/button";
import { deleteAccount } from "~/lib/api/account";
import {
  accountByIdQueryOptions,
  accountQueryOptions,
} from "~/lib/query-options";

export const Route = createFileRoute("/app/account/$id/")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const queryClient = useQueryClient();
  const accountQuery = useQuery(() => accountByIdQueryOptions(params().id));

  const navigate = Route.useNavigate();
  const mutation = useMutation(() => ({
    mutationFn: async (id: string) => {
      await deleteAccount(id);
      navigate({
        to: "..",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: accountQueryOptions().queryKey,
      });
    },
  }));

  function deleteAccountHandler() {
    if (window.confirm("Are you sure you want to delete this account?")) {
      mutation.mutate(params().id);
    }
  }

  return (
    <PageLayout
      title="Account details"
      actions={
        <>
          <Link
            to=".."
            class={buttonVariants({
              variant: "outline",
              size: "icon",
            })}
          >
            <ArrowLeft />
          </Link>
          <Link
            to="/app/account/$id/edit"
            params={{ id: params().id }}
            class={buttonVariants({
              variant: "outline",
              size: "icon",
            })}
          >
            <Edit />
          </Link>
          <Button
            variant="destructive"
            onClick={deleteAccountHandler}
            disabled={mutation.isPending}
          >
            <Trash />
          </Button>
        </>
      }
    >
      <QueryWrapper
        queryResult={accountQuery}
        errorRender={(e) => <div>{e.message}</div>}
      >
        {(account) => (
          <>
            <LabelAndValue label="Id" value={account.account.id} />
            <LabelAndValue label="Name" value={account.account.name} />
            <LabelAndValue
              label="Account type"
              value={account.account.account_type}
            />
            <LabelAndValue
              label="Created at"
              value={dayjs(account.account.created_at).format(
                "MMM D, YYYY h:mm A",
              )}
            />
            <LabelAndValue label="Currency" value={account.currency.code} />
            <LabelAndValue
              label="Starting balance"
              value={
                <Badge
                  class={
                    account.account.starting_balance < 0
                      ? "bg-red-900"
                      : account.account.starting_balance > 0
                        ? "bg-green-900"
                        : ""
                  }
                >
                  <CurrencyDisplay
                    value={account.account.starting_balance}
                    currencyCode={account.currency.code}
                    decimalDigits={account.currency.decimal_digits}
                  />
                </Badge>
              }
            />
            <LabelAndValue
              label="Cash flow"
              value={account.account.is_cash_flow ? "Yes" : "No"}
            />
            <LabelAndValue
              label="Active"
              value={account.account.is_active ? "Yes" : "No"}
            />
            {/* TODO: Show related transaction */}
          </>
        )}
      </QueryWrapper>
    </PageLayout>
  );
}
