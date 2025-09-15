<template>
  <AppPage title="New transaction">
    <template #actions>
      <ULink :to="{ name: '/app/finance/transaction/' }" class="flex items-center gap-2">
        <UIcon name="i-lucide-arrow-left" /> All
      </ULink>
    </template>
    <TransactionEditor />
  </AppPage>
</template>
