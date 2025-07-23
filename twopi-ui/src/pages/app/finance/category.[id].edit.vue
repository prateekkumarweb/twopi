<script setup lang="ts">
import { useCategoryQuery } from "@/lib/category";

const { data: categoryies, state: categoriesState } = useCategoryQuery();
const route = useRoute();
const router = useRouter();
const params = route.params as { id: string };

const category = computed(() => {
  return params.id ? categoryies.value?.categories.find((c) => c.id === params.id) : undefined;
});
</script>

<template>
  <AppPage title="Edit Category">
    <template #actions>
      <UButton
        variant="ghost"
        @click="
          () => {
            router.push({
              name: '/app/finance/category',
            });
          }
        "
      >
        <UIcon name="i-lucide-arrow-left" /> All
      </UButton>
    </template>
    <div v-if="categoriesState.status === 'pending'">
      <p>Loading category...</p>
    </div>
    <CategoryEditor v-else-if="category" :category="category" />
  </AppPage>
</template>
