<script setup>
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import { usePipelineStore } from "@/stores/pipelineStore";
import { getStageColorStyles, resolveStageColor } from "@/constants/pipeline";

const { t } = useI18n();
const pipelineStore = usePipelineStore();

const props = defineProps({
  open: { type: Boolean, default: false },
  jobPostId: { type: [String, Number], default: null },
  stages: { type: Array, default: () => [] },
});

const emit = defineEmits(["close"]);

const localStages = ref([]);
const newStageName = ref("");
const editingId = ref(null);
const editValue = ref("");
const draggedIndex = ref(null);
const saving = ref(false);

watch(
  () => [props.open, props.stages],
  ([isOpen]) => {
    if (isOpen) localStages.value = [...props.stages];
  },
  { immediate: true, deep: true },
);

function startEdit(stage) {
  editingId.value = stage.id;
  editValue.value = stage.name;
}

async function confirmEdit(stage) {
  const name = editValue.value.trim();
  editingId.value = null;
  if (!name || name === stage.name) return;

  try {
    await pipelineStore.renameStage(props.jobPostId, stage.id, { name });
    push.success(t("pipeline.stageManager.renamed"));
  } catch (err) {
    push.error(err?.response?.data?.message || t("pipeline.stageManager.actionFailed"));
  }
}

async function addStage() {
  const name = newStageName.value.trim();
  if (!name) return;

  try {
    saving.value = true;
    await pipelineStore.createStage(props.jobPostId, {
      name,
      stage_type: "custom",
      position: localStages.value.length,
    });
    newStageName.value = "";
    push.success(t("pipeline.stageManager.created"));
  } catch (err) {
    push.error(err?.response?.data?.message || t("pipeline.stageManager.actionFailed"));
  } finally {
    saving.value = false;
  }
}

async function removeStage(stage) {
  if (stage.is_system) return;
  if (!window.confirm(t("pipeline.stageManager.confirmDelete", { name: stage.name }))) return;

  try {
    await pipelineStore.removeStage(props.jobPostId, stage.id);
    push.success(t("pipeline.stageManager.deleted"));
  } catch (err) {
    push.error(err?.response?.data?.message || t("pipeline.stageManager.deleteFailed"));
  }
}

function onDragStart(e, index) {
  draggedIndex.value = index;
  e.dataTransfer.setData("text/plain", String(index));
  e.dataTransfer.effectAllowed = "move";
}

function onDrop(e, targetIndex) {
  e.preventDefault();
  if (draggedIndex.value === null || draggedIndex.value === targetIndex) return;

  const reordered = [...localStages.value];
  const [moved] = reordered.splice(draggedIndex.value, 1);
  reordered.splice(targetIndex, 0, moved);
  localStages.value = reordered;
  draggedIndex.value = null;

  pipelineStore.persistStageOrder(props.jobPostId, reordered).catch((err) => {
    push.error(err?.response?.data?.message || t("pipeline.stageManager.actionFailed"));
    localStages.value = [...props.stages];
  });
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4" @click.self="emit('close')">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col">
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 class="text-base font-semibold text-gray-900">{{ t("pipeline.stageManager.title") }}</h2>
          <button @click="emit('close')" class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-5 py-4 space-y-2">
          <p class="text-xs text-gray-500 mb-2">{{ t("pipeline.stageManager.hint") }}</p>

          <div
            v-for="(stage, index) in localStages"
            :key="stage.id"
            :draggable="!stage.is_system"
            @dragstart="onDragStart($event, index)"
            @dragover.prevent
            @drop="onDrop($event, index)"
            class="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2"
            :class="stage.is_system ? 'bg-gray-50' : 'cursor-grab active:cursor-grabbing bg-white'"
          >
            <svg v-if="!stage.is_system" class="w-4 h-4 text-gray-300 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 4a1 1 0 11-2 0 1 1 0 012 0zM7 10a1 1 0 11-2 0 1 1 0 012 0zM7 16a1 1 0 11-2 0 1 1 0 012 0zM15 4a1 1 0 11-2 0 1 1 0 012 0zM15 10a1 1 0 11-2 0 1 1 0 012 0zM15 16a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
            <span v-else class="w-4 h-4 shrink-0"></span>

            <span class="w-2 h-2 rounded-full shrink-0" :style="getStageColorStyles(resolveStageColor(stage)).dot"></span>

            <input
              v-if="editingId === stage.id"
              v-model="editValue"
              @keyup.enter="confirmEdit(stage)"
              @blur="confirmEdit(stage)"
              class="flex-1 text-sm border-b border-blue-400 focus:outline-none"
              autofocus
            />
            <span v-else @dblclick="startEdit(stage)" class="flex-1 text-sm text-gray-800 truncate">
              {{ stage.name }}
            </span>

            <span v-if="stage.is_system" class="text-[10px] text-gray-400 uppercase shrink-0">
              {{ t("pipeline.stageManager.system") }}
            </span>

            <button
              v-if="editingId !== stage.id"
              @click="startEdit(stage)"
              class="text-gray-400 hover:text-blue-600 shrink-0"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>

            <button
              v-if="!stage.is_system"
              @click="removeStage(stage)"
              class="text-gray-400 hover:text-red-600 shrink-0"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <div class="border-t border-gray-200 px-5 py-4">
          <div class="flex gap-2">
            <input
              v-model="newStageName"
              @keyup.enter="addStage"
              type="text"
              :placeholder="t('pipeline.stageManager.newStagePlaceholder')"
              class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              @click="addStage"
              :disabled="!newStageName.trim() || saving"
              class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {{ t("pipeline.stageManager.add") }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
