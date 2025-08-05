<script setup lang="ts">
defineProps<{
  title?: string;
}>();
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-2">
      <slot name="left-actions"></slot>
      <h2 class="flex-1 text-xl font-semibold">{{ title }}</h2>
      <slot name="actions"></slot>
    </div>
    <slot></slot>
  </div>
</template>
