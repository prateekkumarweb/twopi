<script setup lang="ts">
import { useResetAccount } from "@/lib/auth";
import { ref } from "vue";
import { useRouter } from "vue-router";

const { mutateAsync, error } = useResetAccount();
const router = useRouter();

const open = ref(false);

async function handleReset() {
  const response = await mutateAsync();
  if (response.success) {
    open.value = false;
    router.push({
      name: "/",
    });
  }
}
</script>

<template>
  <AppPage title="Settings">
    <div>
      <p>Manage your account settings here.</p>
      <UModal v-model:open="open" title="Reset Account">
        <UButton class="mt-4" color="error"> Reset Account </UButton>
        <template #body>
          <p>This action will reset your account and delete all data. Are you sure?</p>
          <p v-if="error" class="text-error mt-2">{{ error.message }}</p>
          <UButton class="mr-2 mt-2" color="error" @click="handleReset"> Reset</UButton>
          <UButton class="mt-2" @click="open = false">Cancel</UButton>
        </template>
      </UModal>
    </div>
  </AppPage>
</template>
