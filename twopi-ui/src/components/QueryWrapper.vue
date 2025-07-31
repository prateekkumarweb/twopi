<script setup lang="ts" generic="T, U">
import type { UseQueryReturn } from "@pinia/colada";

type QT = UseQueryReturn<T>;

defineProps<{ data: QT; transform: (data: T) => U }>();
</script>

<template>
  <div v-if="data.status.value === 'pending'">
    <USkeleton class="h-32 w-full" />
  </div>
  <div v-else-if="data.data.value">
    <slot :data="transform(data.data.value)" />
  </div>
</template>
