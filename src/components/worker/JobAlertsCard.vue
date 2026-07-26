<script setup>
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import { getJobAlerts, updateJobAlerts } from "@/services/workers.api";

const { t } = useI18n();

const loading = ref(true);
const saving = ref(false);
const enabled = ref(false);
const hasEmail = ref(false);
const telegramAvailable = ref(false);

/** Alerts can be active when email or Telegram notification channel is linked. */
const hasChannel = computed(() => hasEmail.value || telegramAvailable.value);
const toggleDisabled = computed(() => saving.value || !hasChannel.value);

function normalizePayload(res) {
  return res?.data?.data ?? res?.data ?? {};
}

function applyPrefs(data = {}) {
  if (typeof data.enabled === "boolean") {
    enabled.value = data.enabled;
  }
  if (typeof data.has_email === "boolean") {
    hasEmail.value = data.has_email;
  }
  if (typeof data.telegram_available === "boolean") {
    telegramAvailable.value = data.telegram_available;
  }
}

onMounted(async () => {
  try {
    loading.value = true;
    const res = await getJobAlerts();
    const data = normalizePayload(res);
    enabled.value = !!data.enabled;
    hasEmail.value = data.has_email === true;
    telegramAvailable.value = data.telegram_available === true;
  } catch (err) {
    console.error("[JobAlerts] Failed to fetch:", err);
    hasEmail.value = false;
    telegramAvailable.value = false;
    enabled.value = false;
  } finally {
    loading.value = false;
  }
});

async function onToggle(event) {
  if (!hasChannel.value) {
    event.target.checked = enabled.value;
    return;
  }

  const next = !!event.target.checked;
  const previous = enabled.value;
  enabled.value = next;

  try {
    saving.value = true;
    const res = await updateJobAlerts({ enabled: next });
    const data = normalizePayload(res);
    applyPrefs(data);
    push.success(
      next ? t("jobAlerts.enabledSuccess") : t("jobAlerts.disabledSuccess"),
    );
  } catch (err) {
    enabled.value = previous;
    push.error(err?.response?.data?.message || t("jobAlerts.saveFailed"));
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6 space-y-3">
    <div>
      <h3 class="text-base font-semibold text-slate-900">{{ t("jobAlerts.title") }}</h3>
      <p class="text-sm text-slate-500 mt-1">{{ t("jobAlerts.subtitle") }}</p>
    </div>

    <div v-if="loading" class="text-sm text-slate-500">
      {{ t("loading") }}...
    </div>

    <template v-else>
      <label
        class="flex items-start gap-3"
        :class="toggleDisabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'"
      >
        <input
          type="checkbox"
          class="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-600 disabled:opacity-50"
          :checked="enabled"
          :disabled="toggleDisabled"
          @change="onToggle"
        />
        <span>
          <span class="block text-sm font-medium text-slate-800">
            {{ t("jobAlerts.enableLabel") }}
          </span>
          <span class="block text-xs text-slate-500 mt-0.5">
            {{ t("jobAlerts.enableHint") }}
          </span>
        </span>
      </label>

      <ul
        v-if="hasChannel"
        class="text-xs text-slate-500 space-y-1 pl-1"
      >
        <li v-if="hasEmail">{{ t("jobAlerts.channelEmail") }}</li>
        <li v-if="telegramAvailable">{{ t("jobAlerts.channelTelegram") }}</li>
      </ul>

      <p
        v-if="!hasChannel"
        class="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2"
      >
        {{ t("jobAlerts.addChannelFirst") }}
      </p>
    </template>
  </div>
</template>
