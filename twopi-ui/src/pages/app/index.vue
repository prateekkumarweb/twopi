<script setup lang="ts">
import { useSignOut } from "@/lib/auth";

const { signOut } = useSignOut();
</script>

<template>
  <div class="mb-4">Welcome! You are signed in.</div>
  <UButton @click="() => signOut()">Sign Out</UButton>
</template>
