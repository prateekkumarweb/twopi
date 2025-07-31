<script setup lang="ts">
import { useCategoryQuery } from "@/lib/category";

const { data: categoryies, state: categoriesState } = useCategoryQuery();
const route = useRoute();
const params = route.params as { id: string };

const category = computed(() => {
  return params.id ? categoryies.value?.categories.find((c) => c.id === params.id) : undefined;
});
</script>

<template>
  <AppPage title="Edit category">
    <template #actions>
      <ULink :to="{ name: '/app/finance/category/' }" class="flex items-center gap-2">
        <UIcon name="i-lucide-arrow-left" /> All
      </ULink>
    </template>
    <div v-if="categoriesState.status === 'pending'">
      <p>Loading category...</p>
    </div>
    <CategoryEditor v-else-if="category" :category="category" />
  </AppPage>
</template>
