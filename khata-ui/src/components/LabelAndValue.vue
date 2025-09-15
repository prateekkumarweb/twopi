<script setup lang="ts">
defineProps<{
  label: string;
}>();
</script>

<template>
  <div class="flex flex-nowrap items-center gap-2">
    <div class="grow font-light">{{ label }}</div>
    <div class="overflow-hidden text-ellipsis text-nowrap text-sm"><slot /></div>
  </div>
</template>
