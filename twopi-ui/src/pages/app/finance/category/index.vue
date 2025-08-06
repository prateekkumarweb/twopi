<script setup lang="ts">
import { useCategoryQuery, useDeleteCategoryMutation } from "@/lib/category";

const { mutate } = useDeleteCategoryMutation();

const query = useCategoryQuery();
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
    <QueryWrapper
      v-slot="{ data: categories }"
      :data="query"
      :transform="(data) => data.categories"
      class="space-y-4"
    >
      <UCard v-for="item in categories" :key="item.id">
        <div class="flex">
          <div>{{ item.name }}</div>
          <UBadge v-if="item.group" class="mx-2">{{ item.group }}</UBadge>
          <div v-if="item.icon"><UIcon :name="item.icon" class="ml-2 text-2xl" /></div>
          <div class="flex-1"></div>
          <div class="flex space-x-2">
            <UButton
              variant="outline"
              color="primary"
              @click="
                () => {
                  router.push({
                    name: '/app/finance/category/[id]',
                    params: { id: item.id },
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
                  router.push({ name: '/app/finance/category/[id].edit', params: { id: item.id } });
                }
              "
            >
              <UIcon name="i-lucide-edit" />
            </UButton>
            <UButton variant="outline" color="error" @click="() => mutate(item.id)">
              <UIcon name="i-lucide-trash" />
            </UButton>
          </div>
        </div>
      </UCard>
    </QueryWrapper>
  </AppPage>
</template>
