<script setup>
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import { useAuthStore } from "@/stores/authStore";
import {
  changeEmail,
  startTelegramLinkOAuth,
} from "@/services/auth.api";

const auth = useAuthStore();
const route = useRoute();
const { t } = useI18n();

const showEmailModal = ref(false);
const emailInput = ref("");
const submittingEmail = ref(false);

const isAuthTransitionRoute = computed(() =>
  ["/auth/callback", "/auth/telegram-link"].includes(route.path),
);

const banner = computed(() => {
  if (isAuthTransitionRoute.value) return null;
  if (auth.showTelegramLinkBanner) {
    return {
      type: "telegram",
      message: t("auth.banners.linkTelegram"),
      actionLabel: t("auth.banners.linkTelegramAction"),
    };
  }
  if (auth.showEmailSetupBanner) {
    return {
      type: "email",
      message: t("auth.banners.setupEmail"),
      actionLabel: t("auth.banners.setupEmailAction"),
    };
  }
  return null;
});

function dismiss() {
  if (banner.value?.type === "telegram") {
    auth.dismissTelegramBanner();
  } else if (banner.value?.type === "email") {
    auth.dismissEmailBanner();
  }
}

function onAction() {
  if (banner.value?.type === "telegram") {
    startTelegramLinkOAuth();
    return;
  }
  if (banner.value?.type === "email") {
    emailInput.value = auth.user?.email || "";
    showEmailModal.value = true;
  }
}

async function submitEmail() {
  const email = String(emailInput.value || "").trim().toLowerCase();
  if (!email) {
    push.warning(t("auth.banners.emailRequired"));
    return;
  }

  try {
    submittingEmail.value = true;
    const res = await changeEmail(email);
    const data = res.data?.data || {};

    if (data.token) {
      auth.token = data.token;
      localStorage.setItem("token", data.token);
    }

    auth.mergeUser({ email });
    auth.applyNotificationFlags(data);
    showEmailModal.value = false;
    push.success(t("auth.banners.verificationEmailSent"));
  } catch (err) {
    push.error(
      err?.response?.data?.message || t("auth.banners.failedChangeEmail"),
    );
  } finally {
    submittingEmail.value = false;
  }
}
</script>

<template>
  <div
    v-if="banner"
    class="bg-amber-50 border-b border-amber-200 text-amber-950"
  >
    <div
      class="max-w-290 mx-auto px-4 sm:px-6 md:px-8 py-3 flex flex-col sm:flex-row sm:items-center gap-3"
    >
      <p class="flex-1 text-sm leading-relaxed">
        {{ banner.message }}
      </p>
      <div class="flex items-center gap-2 shrink-0">
        <button
          type="button"
          class="px-3 py-1.5 rounded-md bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition"
          @click="onAction"
        >
          {{ banner.actionLabel }}
        </button>
        <button
          type="button"
          class="px-2 py-1.5 rounded-md text-amber-800/80 hover:bg-amber-100 text-sm"
          :aria-label="t('auth.banners.dismiss')"
          @click="dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  </div>

  <div
    v-if="showEmailModal"
    class="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
    @click.self="showEmailModal = false"
  >
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-5 space-y-4">
      <h3 class="text-lg font-semibold text-gray-900">
        {{ t("auth.banners.setupEmailTitle") }}
      </h3>
      <p class="text-sm text-gray-600">
        {{ t("auth.banners.setupEmailHint") }}
      </p>
      <input
        v-model="emailInput"
        type="email"
        class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        :placeholder="t('auth.placeholders.email')"
      />
      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="px-3 py-2 text-sm rounded-lg border border-gray-200"
          @click="showEmailModal = false"
        >
          {{ t("auth.banners.cancel") }}
        </button>
        <button
          type="button"
          class="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white disabled:opacity-50"
          :disabled="submittingEmail"
          @click="submitEmail"
        >
          {{
            submittingEmail
              ? t("auth.buttons.sending")
              : t("auth.banners.saveEmail")
          }}
        </button>
      </div>
    </div>
  </div>
</template>
