<script setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();

defineProps({
  count: { type: Number, default: 0 },
  singleStage: { type: Boolean, default: true },
});

const emit = defineEmits(["clear", "send", "templates", "history"]);
</script>

<template>
  <div
    class="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 w-[min(920px,calc(100%-2rem))] rounded-xl border border-blue-200 bg-white shadow-xl px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
  >
    <div class="min-w-0">
      <p class="text-sm font-semibold text-gray-900">
        {{ t("communication.bulk.selected", { count }) }}
      </p>
      <p v-if="!singleStage" class="text-xs text-amber-700 mt-0.5">
        {{ t("communication.bulk.singleStageRequired") }}
      </p>
      <p v-else class="text-xs text-gray-500 mt-0.5">
        {{ t("communication.bulk.hint") }}
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2 shrink-0">
      <button
        type="button"
        class="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
        @click="emit('templates')"
      >
        {{ t("communication.templates.manage") }}
      </button>
      <button
        type="button"
        class="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
        @click="emit('history')"
      >
        {{ t("communication.history.title") }}
      </button>
      <button
        type="button"
        class="text-sm px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-800"
        @click="emit('clear')"
      >
        {{ t("communication.bulk.clear") }}
      </button>
      <button
        type="button"
        class="text-sm font-semibold px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="!count || !singleStage"
        @click="emit('send')"
      >
        {{ t("communication.bulk.sendEmail") }}
      </button>
    </div>
  </div>
</template>
