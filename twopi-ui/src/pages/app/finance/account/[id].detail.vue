<template>
  <AppPage title="Account Details">
    <template #actions>
      <ULink :to="{ name: '/app/finance/account/' }" class="flex items-center gap-2">
        <UIcon name="i-lucide-arrow-left" /> All
      </ULink>
    </template>
  </AppPage>
</template>
