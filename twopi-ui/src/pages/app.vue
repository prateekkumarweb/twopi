<script setup lang="ts">
import { onMounted } from "vue";
import { apiClient } from "@/lib/openapi";
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const session = ref();
const unauthorized = ref(false);
const router = useRouter();
const route = useRoute();

onMounted(async () => {
  const { data, error, response } = await apiClient.GET("/twopi-api/api/user");
  if (response.status === 500) {
    console.error(response.statusText, response);
    throw new Error("Internal Server Error");
  }
  if (error) {
    console.error("Auth Error", error);
  }
  if (data) {
    session.value = data ? { user: data } : undefined;
    unauthorized.value = response.status === 401;
  } else {
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
  <template v-if="session">
    <RouterView />
  </template>
</template>
