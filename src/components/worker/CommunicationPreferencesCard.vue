<script setup>
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import { useCommunicationStore } from "@/stores/communicationStore";

const { t } = useI18n();
const communicationStore = useCommunicationStore();

onMounted(() => {
  communicationStore.fetchPreferences();
});

async function toggleOptOut() {
  const next = !communicationStore.preferences.email_opt_out;
  try {
    await communicationStore.savePreferences({ email_opt_out: next });
    push.success(
      next
        ? t("communication.preferences.optOutEnabled")
        : t("communication.preferences.optOutDisabled"),
    );
  } catch (err) {
    push.error(err?.response?.data?.message || t("communication.preferences.saveFailed"));
  }
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6 space-y-3">
    <div>
      <h3 class="text-base font-semibold text-slate-900">{{ t("communication.preferences.title") }}</h3>
      <p class="text-sm text-slate-500 mt-1">{{ t("communication.preferences.subtitle") }}</p>
    </div>

    <div v-if="communicationStore.loadingPreferences" class="text-sm text-slate-500">
      {{ t("loading") }}...
    </div>

    <label v-else class="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        class="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
        :checked="!!communicationStore.preferences.email_opt_out"
        :disabled="communicationStore.savingPreferences"
        @change="toggleOptOut"
      />
      <span>
        <span class="block text-sm font-medium text-slate-800">
          {{ t("communication.preferences.emailOptOut") }}
        </span>
        <span class="block text-xs text-slate-500 mt-0.5">
          {{ t("communication.preferences.emailOptOutHint") }}
        </span>
      </span>
    </label>
  </div>
</template>
