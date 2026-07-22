<script setup>
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import SearchableSelect from "@/components/common/SearchableSelect.vue";
import { CANONICAL_STAGE_TYPES, getStageColorStyles } from "@/constants/pipeline";

const { t } = useI18n();

const props = defineProps({
  jobPosts: { type: Array, default: () => [] },
  selectedJobPostIds: { type: Array, default: () => [] },
  search: { type: String, default: "" },
  stageTypeFilter: { type: String, default: null },
  loadingJobPosts: { type: Boolean, default: false },
  lockedPosition: { type: Boolean, default: false },
  sortBy: { type: String, default: "match_score" },
  minMatchScore: { type: [Number, String], default: null },
});

const emit = defineEmits([
  "update:search",
  "update:selectedJobPostIds",
  "update:stageTypeFilter",
  "update:sortBy",
  "update:minMatchScore",
  "reset",
]);

const searchInput = ref(props.search);
let debounceTimer = null;

watch(searchInput, (val) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => emit("update:search", val), 300);
});

watch(
  () => props.search,
  (val) => {
    if (val !== searchInput.value) searchInput.value = val;
  },
);

const minMatchInput = ref(
  props.minMatchScore == null || props.minMatchScore === "" ? "" : String(props.minMatchScore),
);
let minMatchDebounce = null;

watch(minMatchInput, (val) => {
  clearTimeout(minMatchDebounce);
  minMatchDebounce = setTimeout(() => {
    if (val === "" || val == null) emit("update:minMatchScore", null);
    else emit("update:minMatchScore", Number(val));
  }, 300);
});

watch(
  () => props.minMatchScore,
  (val) => {
    const next = val == null || val === "" ? "" : String(val);
    if (next !== minMatchInput.value) minMatchInput.value = next;
  },
);

const positionOptions = computed(() => [
  { value: "", label: t("pipeline.filters.allPositions") },
  ...props.jobPosts.map((jp) => ({ value: jp.id, label: jp.title })),
]);

const selectedPositionValue = computed(() => props.selectedJobPostIds[0] || "");

function onPositionChange(value) {
  emit("update:selectedJobPostIds", value ? [value] : []);
}

function toggleStageType(type) {
  emit("update:stageTypeFilter", props.stageTypeFilter === type ? null : type);
}

const sortOptions = computed(() => [
  { value: "match_score", label: t("pipeline.filters.sortByMatch") },
  { value: "updated_at", label: t("pipeline.filters.sortByUpdated") },
  { value: "applied_at", label: t("pipeline.filters.sortByApplied") },
]);

const hasActiveFilters = computed(
  () =>
    !!props.search ||
    (!props.lockedPosition && props.selectedJobPostIds.length > 0) ||
    !!props.stageTypeFilter ||
    (props.sortBy && props.sortBy !== "match_score") ||
    (props.minMatchScore != null && props.minMatchScore !== ""),
);

function onReset() {
  minMatchInput.value = "";
  emit("reset");
}
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div class="relative flex-1">
        <svg class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <input
          v-model="searchInput"
          type="text"
          :placeholder="t('pipeline.filters.searchPlaceholder')"
          class="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div v-if="!lockedPosition" class="w-full sm:w-64">
        <SearchableSelect
          :options="positionOptions"
          :value="selectedPositionValue"
          :placeholder="t('pipeline.filters.allPositions')"
          @change="onPositionChange"
        />
      </div>

      <button
        v-if="hasActiveFilters"
        type="button"
        class="text-sm text-gray-500 hover:text-gray-700 whitespace-nowrap"
        @click="onReset"
      >
        {{ t("pipeline.filters.reset") }}
      </button>
    </div>

    <!-- Sort + min match (second row) -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div class="w-full sm:w-56">
        <label class="block text-xs font-medium text-gray-500 mb-1">{{ t("pipeline.filters.sortLabel") }}</label>
        <select
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          :value="sortBy"
          @change="emit('update:sortBy', $event.target.value)"
        >
          <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <div class="w-full sm:w-48">
        <label class="block text-xs font-medium text-gray-500 mb-1">{{ t("pipeline.filters.minMatch") }}</label>
        <div class="flex items-center gap-2">
          <input
            v-model="minMatchInput"
            type="number"
            min="0"
            max="100"
            :placeholder="t('pipeline.filters.minMatchAll')"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span class="text-xs text-gray-400 shrink-0">0–100</span>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="stage in CANONICAL_STAGE_TYPES"
        :key="stage.type"
        type="button"
        class="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
        :style="stageTypeFilter === stage.type ? getStageColorStyles(stage.color).badge : {}"
        :class="stageTypeFilter === stage.type ? 'ring-2 ring-offset-1 ring-current' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'"
        @click="toggleStageType(stage.type)"
      >
        {{ t(stage.i18nKey) }}
      </button>
    </div>
  </div>
</template>
