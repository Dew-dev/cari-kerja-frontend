<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { unsubscribeByToken } from "@/services/communication.api";

const { t } = useI18n();
const route = useRoute();

const loading = ref(true);
const success = ref(false);
const message = ref("");
const error = ref("");

onMounted(async () => {
  const token = route.query.token;
  if (!token) {
    error.value = t("communication.unsubscribe.missingToken");
    loading.value = false;
    return;
  }

  try {
    const res = await unsubscribeByToken(token);
    success.value = true;
    message.value =
      res.data?.message || t("communication.unsubscribe.successDefault");
  } catch (err) {
    error.value =
      err?.response?.data?.message || t("communication.unsubscribe.failed");
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="bg-white p-6 md:p-8 rounded-2xl shadow max-w-md w-full text-center space-y-3">
      <div class="mx-auto h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
        <i class="pi pi-envelope text-blue-600 text-xl"></i>
      </div>

      <h1 class="text-lg font-bold text-gray-900">
        {{ t("communication.unsubscribe.title") }}
      </h1>

      <p v-if="loading" class="text-sm text-gray-600">
        {{ t("communication.unsubscribe.processing") }}
      </p>
      <p v-else-if="success" class="text-sm text-green-700">
        {{ message }}
      </p>
      <p v-else class="text-sm text-red-600">
        {{ error }}
      </p>

      <router-link
        v-if="!loading"
        to="/"
        class="inline-block mt-2 text-sm text-blue-600 hover:underline"
      >
        {{ t("communication.unsubscribe.backHome") }}
      </router-link>
    </div>
  </div>
</template>
