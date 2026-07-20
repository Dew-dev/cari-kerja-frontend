<script setup>
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import { getJobAlerts, updateJobAlerts } from "@/services/workers.api";

const { t } = useI18n();

const loading = ref(true);
const saving = ref(false);
const enabled = ref(false);
const hasEmail = ref(true);

const toggleDisabled = computed(() => saving.value || !hasEmail.value);

function normalizePayload(res) {
  return res?.data?.data ?? res?.data ?? {};
}

onMounted(async () => {
  try {
    loading.value = true;
    const res = await getJobAlerts();
    const data = normalizePayload(res);
    enabled.value = !!data.enabled;
    hasEmail.value = data.has_email !== false;
  } catch (err) {
    console.error("[JobAlerts] Failed to fetch:", err);
    hasEmail.value = true;
    enabled.value = false;
  } finally {
    loading.value = false;
  }
});

async function onToggle(event) {
  if (!hasEmail.value) {
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
    if (typeof data.enabled === "boolean") {
      enabled.value = data.enabled;
    }
    if (typeof data.has_email === "boolean") {
      hasEmail.value = data.has_email;
    }
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
  <div class="bg-white rounded-lg shadow-md border border-gray-200 p-5 space-y-3">
    <div>
      <h3 class="text-base font-semibold text-gray-900">{{ t("jobAlerts.title") }}</h3>
      <p class="text-sm text-gray-600 mt-1">{{ t("jobAlerts.subtitle") }}</p>
    </div>

    <div v-if="loading" class="text-sm text-gray-500">
      {{ t("loading") }}...
    </div>

    <template v-else>
      <label
        class="flex items-start gap-3"
        :class="toggleDisabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'"
      >
        <input
          type="checkbox"
          class="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
          :checked="enabled"
          :disabled="toggleDisabled"
          @change="onToggle"
        />
        <span>
          <span class="block text-sm font-medium text-gray-800">
            {{ t("jobAlerts.enableLabel") }}
          </span>
          <span class="block text-xs text-gray-500 mt-0.5">
            {{ t("jobAlerts.enableHint") }}
          </span>
        </span>
      </label>

      <p
        v-if="!hasEmail"
        class="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2"
      >
        {{ t("jobAlerts.addEmailFirst") }}
      </p>
    </template>
  </div>
</template>
