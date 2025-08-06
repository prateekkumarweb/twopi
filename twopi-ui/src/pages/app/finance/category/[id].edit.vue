<script setup lang="ts">
import { useCategoryQuery } from "@/lib/category";

const query = useCategoryQuery();
const route = useRoute();
const params = route.params as { id: string };
</script>

<template>
  <AppPage title="Edit category">
    <template #actions>
      <ULink :to="{ name: '/app/finance/category/' }" class="flex items-center gap-2">
        <UIcon name="i-lucide-arrow-left" /> All
      </ULink>
    </template>
    <QueryWrapper
      v-slot="{ data: category }"
      :data="query"
      :transform="(data) => data.categories.find((c) => c.id === params.id)"
    >
      <CategoryEditor v-if="category" :category="category" />
    </QueryWrapper>
  </AppPage>
</template>
