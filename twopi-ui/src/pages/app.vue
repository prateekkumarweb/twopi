<script setup lang="ts">
import { useAuthUser, useSignOut } from "@/lib/auth";
import type { NavigationMenuItem } from "@nuxt/ui";
import { useRoute, useRouter } from "vue-router";

const { mutate: signOut } = useSignOut();

const router = useRouter();
const route = useRoute();

const { data: session } = useAuthUser();
const user = computed(() => session.value?.user);

watchEffect(async () => {
  if (!user.value) {
    router.push({
      name: "/signin",
      query: {
        next: route.fullPath,
      },
    });
  }
});

const items: NavigationMenuItem[] = [
  { label: "Personal Finance", type: "label" },
  {
    label: "Dashboard",
    icon: "i-lucide-layout-dashboard",
    to: {
      name: "/app/finance/dashboard",
    },
  },
  {
    label: "Currency",
    icon: "i-lucide-badge-dollar-sign",
    to: {
      name: "/app/finance/currency",
    },
  },
  {
    label: "Category",
    icon: "i-lucide-tag",
    to: {
      name: "/app/finance/category",
    },
  },
  {
    label: "Account",
    icon: "i-lucide-banknote",
    to: {
      name: "/app/finance/account",
    },
  },
  {
    label: "Transaction",
    icon: "i-lucide-wallet-cards",
    to: {
      name: "/app/finance/transaction",
    },
  },
  {
    label: "Import/Export",
    icon: "i-lucide-upload",
    to: {
      name: "/app/finance/import-export",
    },
  },
  {
    label: "Settings",
    icon: "i-lucide-settings",
    to: { name: "/app/settings" },
  },
];
</script>

<template>
  <div v-if="user" class="flex h-screen gap-4 p-4">
    <header class="flex flex-col gap-2">
      <RouterLink to="/" class="flex items-center gap-2">
        <img src="/2pi.svg" alt="TwoPi" class="h-8 w-8" />
        <h1 class="flex-1 text-xl font-semibold">TwoPi</h1>
      </RouterLink>
      <UNavigationMenu orientation="vertical" :items="items" class="flex-1" />
      <div class="flex flex-col gap-2 pl-2">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-user" />
          <div>{{ user.name }}</div>
        </div>
        <div>
          <UButton variant="outline" icon="i-lucide-log-out" @click="() => signOut()">
            Sign out
          </UButton>
        </div>
      </div>
    </header>
    <USeparator orientation="vertical" class="h-full" />
    <div class="w-full">
      <RouterView />
    </div>
  </div>
</template>
