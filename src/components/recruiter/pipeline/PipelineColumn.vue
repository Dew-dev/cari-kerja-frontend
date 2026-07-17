<script setup>
import { ref } from "vue";
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
});

const emit = defineEmits(["move", "open", "chat"]);

const isDragOver = ref(false);

function onDrop(e) {
  e.preventDefault();
  isDragOver.value = false;
  const applicationId = e.dataTransfer.getData("text/plain");
  if (!applicationId) return;
  emit("move", { applicationId, column: props.column });
}

const colorStyles = getStageColorStyles(resolveStageColor(props.column));
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
    <div class="flex items-center justify-between px-3 py-2.5 border-b border-gray-200">
      <div class="flex items-center gap-2 min-w-0">
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
        @move="emit('move', $event)"
        @open="emit('open', $event)"
        @chat="emit('chat', $event)"
      />

      <div v-if="!candidates.length" class="text-center text-xs text-gray-400 py-6">
        {{ t("pipeline.board.emptyColumn") }}
      </div>
    </div>
  </div>
</template>
