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
  <div class="bg-white rounded-lg shadow-md border border-gray-200 p-5 space-y-3">
    <div>
      <h3 class="text-base font-semibold text-gray-900">{{ t("communication.preferences.title") }}</h3>
      <p class="text-sm text-gray-600 mt-1">{{ t("communication.preferences.subtitle") }}</p>
    </div>

    <div v-if="communicationStore.loadingPreferences" class="text-sm text-gray-500">
      {{ t("loading") }}...
    </div>

    <label v-else class="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        class="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        :checked="!!communicationStore.preferences.email_opt_out"
        :disabled="communicationStore.savingPreferences"
        @change="toggleOptOut"
      />
      <span>
        <span class="block text-sm font-medium text-gray-800">
          {{ t("communication.preferences.emailOptOut") }}
        </span>
        <span class="block text-xs text-gray-500 mt-0.5">
          {{ t("communication.preferences.emailOptOutHint") }}
        </span>
      </span>
    </label>
  </div>
</template>
