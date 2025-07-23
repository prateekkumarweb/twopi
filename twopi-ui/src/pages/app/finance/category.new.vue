<script setup lang="ts">
const router = useRouter();
</script>

<template>
  <AppPage title="New Category">
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
    <CategoryEditor />
  </AppPage>
</template>
