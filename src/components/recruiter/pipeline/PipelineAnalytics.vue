<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { getStageColorClasses } from "@/constants/pipeline";

const { t } = useI18n();

const props = defineProps({
  columns: { type: Array, default: () => [] },
  stageCountsMap: { type: Object, default: () => ({}) },
  conversionRates: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

function countFor(column) {
  return props.stageCountsMap[column.key] || 0;
}

const totalCandidates = computed(() => props.columns.reduce((sum, col) => sum + countFor(col), 0));

function columnLabel(column) {
  return column.name || (column.i18nKey ? t(column.i18nKey) : column.stage_type);
}

// Server-provided conversion rates take priority. When the backend hasn't
// implemented `/recruiter/pipeline/analytics` yet (or returns none), fall
// back to a client-side approximation based on current stage distribution
// so the funnel is never empty — clearly marked as an estimate in the UI.
const conversionSteps = computed(() => {
  if (props.conversionRates?.length) {
    return props.conversionRates.map((row) => ({
      fromLabel: row.from_label,
      toLabel: row.to_label,
      rate: row.rate,
      estimated: false,
    }));
  }

  const nonRejectedColumns = props.columns.filter((c) => c.stage_type !== "rejected");
  const cumulativeCounts = nonRejectedColumns.map((_, index) =>
    nonRejectedColumns.slice(index).reduce((sum, col) => sum + countFor(col), 0),
  );

  const steps = [];
  for (let i = 0; i < nonRejectedColumns.length - 1; i++) {
    const from = cumulativeCounts[i];
    const to = cumulativeCounts[i + 1];
    steps.push({
      fromLabel: columnLabel(nonRejectedColumns[i]),
      toLabel: columnLabel(nonRejectedColumns[i + 1]),
      rate: from > 0 ? Math.round((to / from) * 1000) / 10 : 0,
      estimated: true,
    });
  }
  return steps;
});

const hasEstimatedRates = computed(() => conversionSteps.value.some((s) => s.estimated));
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-5">
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
            <span class="w-2 h-2 rounded-full" :class="getStageColorClasses(column.color).dot"></span>
            <span class="text-xs text-gray-500 truncate">{{ columnLabel(column) }}</span>
          </div>
          <div class="text-xl font-bold text-gray-900">
            {{ loading ? "…" : countFor(column) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Conversion funnel -->
    <div v-if="conversionSteps.length">
      <div class="flex items-center gap-2 mb-3">
        <h3 class="text-sm font-semibold text-gray-700">{{ t("pipeline.analytics.conversionRate") }}</h3>
        <span
          v-if="hasEstimatedRates"
          class="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500"
          :title="t('pipeline.analytics.estimatedHint')"
        >
          {{ t("pipeline.analytics.estimated") }}
        </span>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <template v-for="(step, index) in conversionSteps" :key="index">
          <div class="flex items-center gap-2 text-sm">
            <span class="text-gray-500">{{ step.fromLabel }}</span>
            <svg class="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <span class="text-gray-500">{{ step.toLabel }}</span>
            <span class="font-semibold text-blue-600">{{ step.rate }}%</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
