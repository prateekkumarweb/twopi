<script setup lang="ts">
import { useAccountsQuery } from "@/lib/account";
import { useDeleteCategoryMutation } from "@/lib/category";
import { iconMap } from "@/lib/hacks/account-type";

const { mutate } = useDeleteCategoryMutation();

const { state } = useAccountsQuery();
const router = useRouter();
</script>

<template>
  <AppPage title="Account">
    <template #actions>
      <UButton
        @click="
          () => {
            router.push({ name: '/app/finance/account/new' });
          }
        "
      >
        <UIcon name="i-lucide-plus" /> Add
      </UButton>
    </template>
    <div v-if="state.status == 'pending'">
      <USkeleton class="h-32 w-full" />
    </div>
    <div v-else-if="state.status == 'error'" class="text-error">
      <p>Error loading accounts: {{ state.error?.message }}</p>
    </div>
    <div v-else class="space-y-4">
      <UCard v-for="item in state.data.accounts" :key="item.account.id">
        <div class="flex">
          <div>{{ item.account.name }}</div>
          <UBadge class="mx-2" :icon="iconMap[item.account.account_type]">{{
            item.account.account_type
          }}</UBadge>
          <div class="flex-1"></div>
          <div class="flex space-x-2">
            <UButton
              variant="outline"
              color="primary"
              @click="
                () => {
                  router.push({
                    name: '/app/finance/account/[id].detail',
                    params: { id: item.account.id },
                  });
                }
              "
            >
              <UIcon name="i-lucide-eye" />
            </UButton>
            <UButton
              variant="outline"
              color="secondary"
              @click="
                () => {
                  router.push({
                    name: '/app/finance/account/[id].edit',
                    params: { id: item.account.id },
                  });
                }
              "
            >
              <UIcon name="i-lucide-edit" />
            </UButton>
            <UButton variant="outline" color="error" @click="() => mutate(item.account.id)">
              <UIcon name="i-lucide-trash" />
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
  </AppPage>
</template>
