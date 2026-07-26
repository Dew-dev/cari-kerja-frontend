<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { getStageColorStyles, resolveStageColor } from "@/constants/pipeline";

const { t } = useI18n();

const props = defineProps({
  columns: { type: Array, default: () => [] },
  stageCountsMap: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
});

function countFor(column) {
  return props.stageCountsMap[column.key] || 0;
}

const totalCandidates = computed(() => props.columns.reduce((sum, col) => sum + countFor(col), 0));

function columnLabel(column) {
  return column.name || (column.i18nKey ? t(column.i18nKey) : column.stage_type);
}
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
    <!-- Stage counts -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-gray-700">{{ t("pipeline.analytics.stageCounts") }}</h3>
        <span class="text-xs text-gray-500">{{ t("pipeline.analytics.total", { count: totalCandidates }) }}</span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          v-for="column in columns"
          :key="column.key"
          class="rounded-lg border border-gray-200 p-3 text-center"
        >
          <div class="flex items-center justify-center gap-1.5 mb-1">
            <span class="w-2 h-2 rounded-full" :style="getStageColorStyles(resolveStageColor(column)).dot"></span>
            <span class="text-xs text-gray-500 truncate">{{ columnLabel(column) }}</span>
          </div>
          <div class="text-xl font-bold text-gray-900">
            {{ loading ? "…" : countFor(column) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
