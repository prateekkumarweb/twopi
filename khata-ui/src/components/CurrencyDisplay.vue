<script setup lang="ts">
const props = defineProps<{
  value: number;
  currencyCode: string;
  decimalDigits: number;
}>();

const amount = computed(() => props.value / Math.pow(10, props.decimalDigits));
</script>

<template>
  <div>
    {{
      Intl.NumberFormat("en-US", {
        style: "currency",
        currency: props.currencyCode,
      }).format(amount)
    }}
  </div>
</template>
