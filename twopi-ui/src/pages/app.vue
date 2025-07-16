<script setup lang="ts">
import { useAuthUser } from "@/lib/auth";
import type { NavigationMenuItem } from "@nuxt/ui";
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

const items: NavigationMenuItem[] = [
  { label: "Personal Finance", type: "label" },
  {
    label: "App",
    icon: "i-lucide-layout-dashboard",
    to: "/app",
  },
  {
    label: "Currency",
    icon: "i-lucide-badge-dollar-sign",
  },
  {
    label: "Category",
    icon: "i-lucide-tag",
  },
  {
    label: "Account",
    icon: "i-lucide-banknote",
  },
  {
    label: "Transaction",
    icon: "i-lucide-wallet-cards",
  },
  {
    label: "Import/Export",
    icon: "i-lucide-upload",
  },
];
</script>

<template>
  <div v-if="user" class="flex h-screen gap-4 p-4">
    <header>
      <UNavigationMenu
        orientation="vertical"
        :items="items"
        class="data-[orientation=vertical]:w-48"
      />
    </header>
    <div class="w-full">
      <RouterView />
    </div>
  </div>
</template>
