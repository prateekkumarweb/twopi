<script setup lang="ts">
import { useAuthUser } from "@/lib/auth";
import { computed, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();

const { session } = useAuthUser();
const user = computed(() => session.value.data?.user);

watchEffect(async () => {
  if (!user.value) {
    router.push({
      path: "/signin",
      query: {
        next: route.fullPath,
      },
    });
  }
});
</script>

<template>
  <template v-if="user">
    <RouterView />
  </template>
</template>
