<script setup lang="ts">
import { useAuthUser } from "@/lib/auth";

const { session } = useAuthUser();
</script>

<template>
  <div v-if="session.data?.user" class="p-4">
    <RouterLink to="/app">Go to App</RouterLink>
  </div>
  <div v-else class="p-4">
    <RouterLink to="/signin">Sign In / Sign Up</RouterLink>
  </div>
</template>
