<script setup lang="ts">
import { useAuthUser, useSignOut } from "@/lib/auth";
import type { NavigationMenuItem } from "@nuxt/ui";

const { mutateAsync: signOut } = useSignOut();
const { data: session } = useAuthUser();
const user = computed(() => session.value?.user);

const router = useRouter();
const route = useRoute();

watchEffect(() => {
  if (!user.value) {
    router.push({ name: "/signin", query: { next: route.fullPath } });
  }
});

const showNav = ref(false);

const onSelect: NavigationMenuItem["onSelect"] = () => {
  showNav.value = false;
};

const items: NavigationMenuItem[] = [
  {
    label: "Finance",
    icon: "i-lucide-wallet",
    open: true,
    children: [
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
          name: "/app/finance/currency/",
        },
      },
      {
        label: "Category",
        icon: "i-lucide-tag",
        to: {
          name: "/app/finance/category/",
        },
      },
      {
        label: "Account",
        icon: "i-lucide-banknote",
        to: {
          name: "/app/finance/account/",
        },
      },
      {
        label: "Transaction",
        icon: "i-lucide-wallet-cards",
        to: {
          name: "/app/finance/transaction/",
        },
      },
      {
        label: "Import/Export",
        icon: "i-lucide-upload",
        to: {
          name: "/app/finance/import-export",
        },
      },
    ].map((item) => ({
      ...item,
      onSelect,
    })),
  },
  {
    label: "Settings",
    icon: "i-lucide-settings",
    to: { name: "/app/settings" },
    onSelect,
  },
];
</script>

<template>
  <div v-if="user" class="relative flex h-screen flex-col">
    <header class="border-b-accented flex w-full gap-4 border-b p-4">
      <RouterLink to="/app" class="flex items-center gap-2">
        <img src="/khata.svg" alt="Khata" class="h-8 w-8" />
        <h1 class="flex-1 text-xl font-semibold">Khata</h1>
      </RouterLink>
      <div class="flex-1"></div>
      <button @click="showNav = !showNav">
        <UIcon :name="showNav ? 'i-lucide-x' : 'i-lucide-menu'" class="text-2xl" />
      </button>
    </header>
    <Transition
      enter-active-class="transition-all duration-300"
      leave-active-class="transition-all duration-300"
      enter-from-class="-translate-y-20 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-20 opacity-0"
    >
      <div
        v-if="showNav"
        class="border-b-accented bg-default absolute top-16 z-10 mt-[1px] w-full border-b py-2"
      >
        <UNavigationMenu orientation="vertical" :items="items" class="w-full" />
        <div class="flex flex-col gap-2 pl-3 pt-2">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-user" />
            <div>{{ user.name }}</div>
          </div>
          <div class="pb-2">
            <UButton
              variant="outline"
              icon="i-lucide-log-out"
              @click="
                () => {
                  signOut();
                }
              "
            >
              Sign out
            </UButton>
          </div>
        </div>
      </div>
    </Transition>
    <div class="w-full overflow-auto p-4">
      <RouterView />
    </div>
  </div>
</template>
