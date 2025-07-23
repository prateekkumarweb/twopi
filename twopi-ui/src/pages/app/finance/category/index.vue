<script setup lang="ts">
import CategoryAction from "@/components/CategoryAction.vue";
import { useCategoryQuery } from "@/lib/category";
import type { TableColumn } from "@nuxt/ui";

interface Category {
  id: string;
  name: string;
  group: string;
  icon: string;
}

const UIcon = resolveComponent("UIcon");

const columns: TableColumn<Category>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "group", header: "Group" },
  {
    accessorKey: "icon",
    header: "Icon",
    cell: ({ row }) => {
      return h(UIcon, { name: row.original.icon, class: "text-xl" });
    },
  },
  {
    header: "Actions",
    cell: ({ row }) => {
      return h(CategoryAction, {
        id: row.original.id,
      });
    },
  },
];

const { state } = useCategoryQuery();
const router = useRouter();
</script>

<template>
  <AppPage title="Category">
    <template #actions>
      <UButton
        @click="
          () => {
            router.push({ name: '/app/finance/category/new' });
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
      <p>Error loading categories: {{ state.error?.message }}</p>
    </div>
    <div v-else>
      <UTable :columns="columns" :data="state.data.categories" />
    </div>
  </AppPage>
</template>
