<script setup>
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
  count: { type: Number, default: 0 },
  singleStage: { type: Boolean, default: true },
  columns: { type: Array, default: () => [] },
  moving: { type: Boolean, default: false },
});

const emit = defineEmits(["clear", "send", "move"]);

const targetColumnKey = ref("");

const stageOptions = computed(() =>
  (props.columns || []).filter((col) => col && col.key && !col.isFallback),
);

const selectedColumn = computed(() =>
  stageOptions.value.find((col) => String(col.key) === String(targetColumnKey.value)) || null,
);

function onMove() {
  if (!selectedColumn.value || props.moving) return;
  emit("move", selectedColumn.value);
}
</script>

<template>
  <div
    class="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 w-[min(920px,calc(100%-2rem))] rounded-xl border border-blue-200 bg-white shadow-xl px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
  >
    <div class="min-w-0">
      <p class="text-sm font-semibold text-gray-900">
        {{ t("communication.bulk.selected", { count }) }}
      </p>
      <p class="text-xs text-gray-500 mt-0.5">
        {{ t("communication.bulk.moveHint") }}
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2 shrink-0">
      <select
        v-model="targetColumnKey"
        class="text-sm border border-gray-300 rounded-lg px-3 py-2 min-w-[10rem] focus:outline-none focus:ring-2 focus:ring-blue-500"
        :disabled="moving || !stageOptions.length"
      >
        <option value="" disabled>
          {{ t("communication.bulk.moveToPlaceholder") }}
        </option>
        <option v-for="col in stageOptions" :key="col.key" :value="col.key">
          {{ col.name || (col.i18nKey ? t(col.i18nKey) : col.key) }}
        </option>
      </select>

      <button
        type="button"
        class="text-sm font-semibold px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="!count || !selectedColumn || moving"
        @click="onMove"
      >
        {{ moving ? t("communication.bulk.moving") : t("communication.bulk.moveSelected") }}
      </button>

      <button
        type="button"
        class="text-sm px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-800"
        :disabled="moving"
        @click="emit('clear')"
      >
        {{ t("communication.bulk.clear") }}
      </button>

      <button
        type="button"
        class="text-sm font-semibold px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="!count || !singleStage || moving"
        @click="emit('send')"
      >
        {{ t("communication.bulk.sendEmail") }}
      </button>
    </div>
  </div>
</template>
