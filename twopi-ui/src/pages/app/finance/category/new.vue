<template>
  <AppPage title="New category">
    <template #actions>
      <ULink :to="{ name: '/app/finance/category/' }" class="flex items-center gap-2">
        <UIcon name="i-lucide-arrow-left" /> All
      </ULink>
    </template>
    <CategoryEditor />
  </AppPage>
</template>
