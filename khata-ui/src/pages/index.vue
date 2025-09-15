<script setup lang="ts">
import { useAuthUser } from "@/lib/auth";

const { data: session } = useAuthUser();
</script>

<template>
  <div v-if="session?.user" class="p-4">
    <RouterLink :to="{ name: '/app/' }">Go to App</RouterLink>
  </div>
  <div v-else class="p-4">
    <RouterLink :to="{ name: '/signin' }">Sign In / Sign Up</RouterLink>
  </div>
</template>
