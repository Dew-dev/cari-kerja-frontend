<script setup>
import { useI18n } from "vue-i18n";
import PipelineColumn from "./PipelineColumn.vue";

const { t } = useI18n();

defineProps({
  columns: { type: Array, default: () => [] },
  candidatesByColumn: { type: Object, default: () => ({}) },
  isMoving: { type: Function, default: () => () => false },
  loading: { type: Boolean, default: false },
  showJobTitle: { type: Boolean, default: true },
  isSelected: { type: Function, default: () => () => false },
  isColumnFullySelected: { type: Function, default: () => () => false },
  isColumnPartiallySelected: { type: Function, default: () => () => false },
});

const emit = defineEmits(["move", "open", "chat", "toggle-select", "toggle-column-select"]);
</script>

<template>
  <div v-if="loading" class="flex justify-center py-16">
    <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
  </div>

  <div v-else-if="!columns.length" class="text-center py-16 text-gray-500 text-sm">
    {{ t("pipeline.board.noStages") }}
  </div>

  <div v-else class="flex gap-3 overflow-x-auto pb-2">
    <PipelineColumn
      v-for="column in columns"
      :key="column.key"
      :column="column"
      :candidates="candidatesByColumn[column.key] || []"
      :all-columns="columns"
      :is-moving="isMoving"
      :show-job-title="showJobTitle"
      :is-selected="isSelected"
      :column-fully-selected="isColumnFullySelected(column.key)"
      :column-partially-selected="isColumnPartiallySelected(column.key)"
      @move="emit('move', $event)"
      @open="emit('open', $event)"
      @chat="emit('chat', $event)"
      @toggle-select="emit('toggle-select', $event)"
      @toggle-column-select="emit('toggle-column-select', $event)"
    />
  </div>
</template>
