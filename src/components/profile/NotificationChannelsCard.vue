<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import { useAuthStore } from "@/stores/authStore";
import {
  changeEmail,
  startTelegramLinkOAuth,
} from "@/services/auth.api";
import { displayEmail } from "@/utils/authFlags";

const { t } = useI18n();
const auth = useAuthStore();

const emailDraft = ref(displayEmail(auth.user?.email) || "");
const savingEmail = ref(false);

watch(
  () => auth.user?.email,
  (email) => {
    emailDraft.value = displayEmail(email) || "";
  },
);

onMounted(async () => {
  // Sinkronkan flag channel dari backend (email sudah diverifikasi tapi localStorage masih stale)
  try {
    await auth.refreshToken({ logoutOnFail: false });
  } catch {
    /* ignore — tampilan tetap pakai state lokal */
  }
});

const loginProvider = computed(() => auth.loginProvider || "local");

const loginProviderLabel = computed(() => {
  const map = {
    local: t("profile.notificationChannels.providerLocal"),
    google: t("profile.notificationChannels.providerGoogle"),
    telegram: t("profile.notificationChannels.providerTelegram"),
  };
  return map[loginProvider.value] || loginProvider.value;
});

const emailValue = computed(() => displayEmail(auth.user?.email));

/** @returns {{ state: 'connected'|'pending'|'disconnected', label: string, badge: string, hint?: string }} */
const emailStatus = computed(() => {
  if (!emailValue.value) {
    return {
      state: "disconnected",
      label: t("profile.notificationChannels.emailNotSet"),
      badge: t("profile.notificationChannels.notConnected"),
    };
  }

  // Login Telegram: email tersimpan tapi belum diverifikasi → pending, bukan "not connected"
  if (loginProvider.value === "telegram" && auth.requiresEmailSetup) {
    return {
      state: "pending",
      label: emailValue.value,
      badge: t("profile.notificationChannels.pendingVerification"),
      hint: t("profile.notificationChannels.pendingVerificationHint"),
    };
  }

  return {
    state: "connected",
    label: emailValue.value,
    badge: t("profile.notificationChannels.connected"),
  };
});

const canManageEmail = computed(
  () => loginProvider.value === "telegram" || loginProvider.value === "local",
);

const telegramStatus = computed(() => {
  if (loginProvider.value === "telegram") {
    return {
      connected: true,
      isLoginMethod: true,
      label: t("profile.notificationChannels.telegramAsLogin"),
    };
  }
  if (!auth.requiresTelegramLink) {
    return {
      connected: true,
      isLoginMethod: false,
      label: t("profile.notificationChannels.telegramLinked"),
    };
  }
  return {
    connected: false,
    isLoginMethod: false,
    label: t("profile.notificationChannels.telegramNotLinked"),
  };
});

const canLinkTelegram = computed(
  () =>
    (loginProvider.value === "local" || loginProvider.value === "google") &&
    auth.requiresTelegramLink,
);

async function submitEmail() {
  const email = String(emailDraft.value || "").trim().toLowerCase();
  if (!email) {
    push.warning(t("auth.banners.emailRequired"));
    return;
  }

  try {
    savingEmail.value = true;
    const res = await changeEmail(email);
    const data = res.data?.data || {};

    if (data.token) {
      auth.token = data.token;
      localStorage.setItem("token", data.token);
    }

    auth.mergeUser({ email });
    auth.applyNotificationFlags(data);
    push.success(t("auth.banners.verificationEmailSent"));
  } catch (err) {
    push.error(
      err?.response?.data?.message || t("auth.banners.failedChangeEmail"),
    );
  } finally {
    savingEmail.value = false;
  }
}

function connectTelegram() {
  startTelegramLinkOAuth();
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm p-5 md:p-6 space-y-5">
    <div>
      <h3 class="text-base md:text-lg font-semibold text-gray-900">
        {{ t("profile.notificationChannels.title") }}
      </h3>
      <p class="text-xs md:text-sm text-gray-600 mt-1">
        {{ t("profile.notificationChannels.subtitle") }}
      </p>
    </div>

    <!-- Login method -->
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
    >
      <div>
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {{ t("profile.notificationChannels.loginMethod") }}
        </p>
        <p class="text-sm font-semibold text-gray-900 mt-0.5">
          {{ loginProviderLabel }}
        </p>
      </div>
      <span
        class="inline-flex self-start sm:self-auto items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-200 text-slate-700"
      >
        {{ t("profile.notificationChannels.loginOnly") }}
      </span>
    </div>

    <!-- Email channel -->
    <div class="rounded-xl border border-gray-200 p-4 space-y-3">
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div class="min-w-0">
          <p class="text-sm font-semibold text-gray-900">
            {{ t("profile.notificationChannels.emailChannel") }}
          </p>
          <p class="text-xs text-gray-500 mt-0.5">
            {{ t("profile.notificationChannels.emailChannelHint") }}
          </p>
        </div>
        <span
          class="inline-flex self-start items-center px-2.5 py-1 rounded-full text-xs font-medium"
          :class="{
            'bg-emerald-100 text-emerald-800': emailStatus.state === 'connected',
            'bg-sky-100 text-sky-800': emailStatus.state === 'pending',
            'bg-amber-100 text-amber-800': emailStatus.state === 'disconnected',
          }"
        >
          {{ emailStatus.badge }}
        </span>
      </div>

      <p class="text-sm text-gray-700 break-all">{{ emailStatus.label }}</p>
      <p v-if="emailStatus.hint" class="text-xs text-sky-700">
        {{ emailStatus.hint }}
      </p>

      <div v-if="canManageEmail" class="flex flex-col sm:flex-row gap-2">
        <input
          v-model="emailDraft"
          type="email"
          class="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-10"
          :placeholder="t('profile.emailNotificationPlaceholder')"
        />
        <button
          type="button"
          class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 min-h-10"
          :disabled="savingEmail"
          @click="submitEmail"
        >
          {{
            savingEmail
              ? t("auth.buttons.sending")
              : t("profile.notificationChannels.saveEmail")
          }}
        </button>
      </div>
      <p v-else class="text-xs text-gray-500">
        {{ t("profile.notificationChannels.emailManagedByGoogle") }}
      </p>
    </div>

    <!-- Telegram channel -->
    <div class="rounded-xl border border-gray-200 p-4 space-y-3">
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div class="min-w-0">
          <p class="text-sm font-semibold text-gray-900">
            {{ t("profile.notificationChannels.telegramChannel") }}
          </p>
          <p class="text-xs text-gray-500 mt-0.5">
            {{ t("profile.notificationChannels.telegramChannelHint") }}
          </p>
        </div>
        <span
          class="inline-flex self-start items-center px-2.5 py-1 rounded-full text-xs font-medium"
          :class="
            telegramStatus.connected
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          "
        >
          {{
            telegramStatus.connected
              ? t("profile.notificationChannels.connected")
              : t("profile.notificationChannels.notConnected")
          }}
        </span>
      </div>

      <p class="text-sm text-gray-700">{{ telegramStatus.label }}</p>

      <button
        v-if="canLinkTelegram"
        type="button"
        class="px-4 py-2 rounded-lg bg-[#229ED9] text-white text-sm font-medium hover:bg-[#1b8bc0] min-h-10"
        @click="connectTelegram"
      >
        {{ t("profile.notificationChannels.connectTelegram") }}
      </button>
      <p
        v-else-if="telegramStatus.isLoginMethod"
        class="text-xs text-gray-500"
      >
        {{ t("profile.notificationChannels.telegramLoginHint") }}
      </p>
    </div>
  </div>
</template>
