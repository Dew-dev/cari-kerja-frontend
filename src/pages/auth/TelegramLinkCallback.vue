<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import { useAuthStore } from "@/stores/authStore";
import { linkTelegram } from "@/services/auth.api";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const { t } = useI18n();

const status = ref("loading");
const errorMessage = ref("");

onMounted(async () => {
  if (!auth.isLoggedIn) {
    push.warning(t("auth.banners.loginRequiredForLink"));
    router.replace("/login");
    return;
  }

  const code = route.query.code;
  if (!code) {
    status.value = "error";
    errorMessage.value = t("auth.banners.missingTelegramCode");
    return;
  }

  try {
    const res = await linkTelegram(String(code));
    const data = res.data?.data || {};
    auth.applyNotificationFlags({
      requires_telegram_link: data.requires_telegram_link ?? false,
    });
    auth.markTelegramLinked();
    status.value = "success";
    push.success(t("auth.banners.telegramLinked"));
    setTimeout(() => {
      router.replace(auth.role === "recruiter" ? "/recruiter/jobs" : "/jobposts");
    }, 1200);
  } catch (err) {
    status.value = "error";
    errorMessage.value =
      err?.response?.data?.message || t("auth.banners.failedLinkTelegram");
  }
});
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4"
  >
    <div class="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-3">
      <p v-if="status === 'loading'" class="text-gray-700 font-medium">
        {{ t("auth.banners.linkingTelegram") }}
      </p>
      <p v-else-if="status === 'success'" class="text-green-600 font-medium">
        {{ t("auth.banners.telegramLinked") }}
      </p>
      <div v-else class="space-y-3">
        <p class="text-red-600">{{ errorMessage }}</p>
        <button
          type="button"
          class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm"
          @click="router.replace('/jobposts')"
        >
          {{ t("auth.banners.backToApp") }}
        </button>
      </div>
    </div>
  </div>
</template>
