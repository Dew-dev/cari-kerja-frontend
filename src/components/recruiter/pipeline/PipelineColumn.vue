<script setup>
import { computed, ref, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import PipelineCard from "./PipelineCard.vue";
import { getStageColorStyles, resolveStageColor } from "@/constants/pipeline";

const { t } = useI18n();

const props = defineProps({
  column: { type: Object, required: true },
  candidates: { type: Array, default: () => [] },
  allColumns: { type: Array, default: () => [] },
  isMoving: { type: Function, default: () => () => false },
  showJobTitle: { type: Boolean, default: true },
  isSelected: { type: Function, default: () => () => false },
  columnFullySelected: { type: Boolean, default: false },
  columnPartiallySelected: { type: Boolean, default: false },
});

const emit = defineEmits(["move", "open", "chat", "toggle-select", "toggle-column-select"]);

const isDragOver = ref(false);
const headerCheckboxRef = ref(null);

function onDrop(e) {
  e.preventDefault();
  isDragOver.value = false;
  const applicationId = e.dataTransfer.getData("text/plain");
  if (!applicationId) return;
  emit("move", { applicationId, column: props.column });
}

const colorStyles = computed(() => getStageColorStyles(resolveStageColor(props.column)));

watch(
  () => [props.columnFullySelected, props.columnPartiallySelected, headerCheckboxRef.value],
  async () => {
    await nextTick();
    if (headerCheckboxRef.value) {
      headerCheckboxRef.value.indeterminate =
        props.columnPartiallySelected && !props.columnFullySelected;
    }
  },
  { immediate: true },
);

function onHeaderCheckboxChange(e) {
  emit("toggle-column-select", {
    columnKey: props.column.key,
    selected: e.target.checked,
  });
}
</script>

<template>
  <div
    class="w-72 shrink-0 flex flex-col bg-gray-50 rounded-lg border-2 transition-colors"
    :style="isDragOver ? colorStyles.header : {}"
    :class="isDragOver ? 'bg-blue-50/40' : 'border-gray-200'"
    @dragover.prevent="isDragOver = true"
    @dragleave="isDragOver = false"
    @drop="onDrop"
  >
    <!-- Column header -->
    <div class="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 gap-2">
      <div class="flex items-center gap-2 min-w-0">
        <input
          ref="headerCheckboxRef"
          type="checkbox"
          class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
          :checked="columnFullySelected"
          :disabled="!candidates.length"
          :aria-label="t('communication.bulk.selectColumn')"
          @change="onHeaderCheckboxChange"
        />
        <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="colorStyles.dot"></span>
        <span class="text-sm font-semibold text-gray-800 truncate">
          {{ column.name || t(column.i18nKey) }}
        </span>
      </div>
      <span class="text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-full px-2 py-0.5 shrink-0">
        {{ candidates.length }}
      </span>
    </div>

    <!-- Cards -->
    <div class="flex-1 p-2 space-y-2 overflow-y-auto min-h-[120px] max-h-[65vh]">
      <PipelineCard
        v-for="candidate in candidates"
        :key="candidate.application_id"
        :candidate="candidate"
        :columns="allColumns"
        :current-column-key="column.key"
        :moving="isMoving(candidate.application_id)"
        :show-job-title="showJobTitle"
        :selected="isSelected(candidate.application_id)"
        @move="emit('move', $event)"
        @open="emit('open', $event)"
        @chat="emit('chat', $event)"
        @toggle-select="emit('toggle-select', $event)"
      />

      <div v-if="!candidates.length" class="text-center text-xs text-gray-400 py-6">
        {{ t("pipeline.board.emptyColumn") }}
      </div>
    </div>
  </div>
</template>
