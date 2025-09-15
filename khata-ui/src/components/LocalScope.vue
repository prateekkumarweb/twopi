<script setup lang="ts" generic="T">
defineProps<{ scope: T }>();
</script>

<template>
  <slot :scope="scope" />
</template>
