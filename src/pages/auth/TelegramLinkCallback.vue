<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import { useAuthStore } from "@/stores/authStore";
import { linkTelegram } from "@/services/auth.api";
import {
  clearOAuthLinkIntent,
  isTelegramLinkIntent,
  restoreSessionBackup,
} from "@/utils/oauthIntent";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const { t } = useI18n();

const status = ref("loading");
const errorMessage = ref("");

function ensureSessionFromBackup() {
  if (auth.isLoggedIn) return true;
  const backup = restoreSessionBackup();
  if (!backup?.token) return false;

  auth.token = backup.token;
  auth.$patch({ refreshToken: backup.refreshToken || null });
  auth.user = backup.user || null;
  localStorage.setItem("token", backup.token);
  if (backup.refreshToken) {
    localStorage.setItem("refreshToken", backup.refreshToken);
  }
  if (backup.user) {
    localStorage.setItem("user", JSON.stringify(backup.user));
  }
  return true;
}

onMounted(async () => {
  const hadLinkIntent = isTelegramLinkIntent();
  ensureSessionFromBackup();

  if (!auth.isLoggedIn) {
    clearOAuthLinkIntent();
    push.warning(t("auth.banners.loginRequiredForLink"));
    router.replace("/login");
    return;
  }

  const error = route.query.error;
  if (error) {
    clearOAuthLinkIntent();
    status.value = "error";
    errorMessage.value = String(error);
    return;
  }

  const code = route.query.code;
  if (!code) {
    clearOAuthLinkIntent();
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
    clearOAuthLinkIntent();
    status.value = "success";
    push.success(t("auth.banners.telegramLinked"));
    setTimeout(() => {
      router.replace(
        auth.role === "recruiter" ? "/recruiter/jobs" : "/profile/edit",
      );
    }, 1200);
  } catch (err) {
    status.value = "error";
    const apiMessage = err?.response?.data?.message || "";
    // Telegram sudah dipakai sebagai metode login akun lain
    if (/already used as a login method/i.test(apiMessage)) {
      errorMessage.value = t("auth.banners.telegramAlreadyLoginAccount");
    } else if (/already linked/i.test(apiMessage)) {
      errorMessage.value = t("auth.banners.telegramAlreadyLinked");
    } else {
      errorMessage.value = apiMessage || t("auth.banners.failedLinkTelegram");
    }

    // Restore dulu, baru clear — clear menghapus backup di sessionStorage
    if (hadLinkIntent) {
      ensureSessionFromBackup();
    }
    clearOAuthLinkIntent();
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
          @click="router.replace('/profile/edit')"
        >
          {{ t("auth.banners.backToApp") }}
        </button>
      </div>
    </div>
  </div>
</template>
