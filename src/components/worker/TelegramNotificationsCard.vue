<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import { useI18n } from "vue-i18n";
import api from "@/services/api";

const { t } = useI18n();

const loading = ref(true);
const telegramConnected = ref(false);
const telegramAvailable = ref(false);
const telegramUsername = ref("");
const telegramDisplayName = ref("");
const telegramBotStartUrl = ref("");

const needsActivation = computed(
  () =>
    telegramConnected.value &&
    !telegramAvailable.value &&
    !!telegramBotStartUrl.value,
);

const showCard = computed(
  () =>
    telegramConnected.value ||
    telegramAvailable.value ||
    needsActivation.value,
);

function applyTelegramFields(data = {}) {
  telegramConnected.value = !!data.telegram_connected;
  telegramAvailable.value = !!data.telegram_available;
  telegramUsername.value = data.telegram_username || "";
  telegramDisplayName.value = data.telegram_display_name || "";
  telegramBotStartUrl.value = data.telegram_bot_start_url || "";
}

async function refreshTelegramStatus() {
  try {
    const res = await api.get("/users/workers/me");
    const data = res.data?.data || res.data || {};
    applyTelegramFields(data);
  } catch (err) {
    console.warn("[TelegramNotifications] Failed to refresh /me:", err);
  }
}

function openBotStart() {
  if (!telegramBotStartUrl.value) return;
  window.open(telegramBotStartUrl.value, "_blank", "noopener,noreferrer");
}

function onWindowFocus() {
  if (needsActivation.value) {
    void refreshTelegramStatus();
  }
}

function onVisibilityChange() {
  if (document.visibilityState === "visible" && needsActivation.value) {
    void refreshTelegramStatus();
  }
}

onMounted(async () => {
  try {
    loading.value = true;
    await refreshTelegramStatus();
  } finally {
    loading.value = false;
  }
  window.addEventListener("focus", onWindowFocus);
  document.addEventListener("visibilitychange", onVisibilityChange);
});

onBeforeUnmount(() => {
  window.removeEventListener("focus", onWindowFocus);
  document.removeEventListener("visibilitychange", onVisibilityChange);
});
</script>

<template>
  <div
    v-if="loading || showCard"
    class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6 space-y-3"
  >
    <div>
      <h3 class="text-base font-semibold text-slate-900">
        {{ t("profile.telegramNotifications.title") }}
      </h3>
      <p class="text-sm text-slate-500 mt-1">
        {{ t("profile.telegramNotifications.subtitle") }}
      </p>
    </div>

    <div v-if="loading" class="text-sm text-slate-500">
      {{ t("loading") }}...
    </div>

    <template v-else>
      <div
        v-if="telegramAvailable"
        class="rounded-xl border border-green-100 bg-green-50 px-3 py-2.5 text-sm text-green-800"
      >
        <p class="font-medium">{{ t("profile.telegramNotifications.active") }}</p>
        <p
          v-if="telegramDisplayName || telegramUsername"
          class="text-xs text-green-700 mt-0.5"
        >
          {{ telegramDisplayName || `@${telegramUsername}` }}
          <span v-if="telegramDisplayName && telegramUsername" class="text-green-600">
            (@{{ telegramUsername }})
          </span>
        </p>
      </div>

      <div
        v-else-if="needsActivation"
        class="space-y-3"
      >
        <p class="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
          {{ t("profile.telegramNotifications.activateHint") }}
        </p>
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1b8bc0] transition duration-200 min-h-11"
          @click="openBotStart"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          {{ t("profile.telegramNotifications.activateButton") }}
        </button>
      </div>

      <p
        v-else-if="telegramConnected"
        class="text-sm text-slate-600"
      >
        {{ t("profile.telegramNotifications.connectedPending") }}
      </p>
    </template>
  </div>
</template>
