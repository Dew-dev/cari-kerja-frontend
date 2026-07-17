<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
  candidate: { type: Object, required: true },
  columns: { type: Array, default: () => [] },
  currentColumnKey: { type: String, default: "" },
  moving: { type: Boolean, default: false },
  showJobTitle: { type: Boolean, default: true },
});

const emit = defineEmits(["move", "open", "chat"]);

const linkStorageUrl = import.meta.env.VITE_FILE_STORAGE_URL || "";

const menuOpen = ref(false);
const rootRef = ref(null);

function onClickOutside(e) {
  if (rootRef.value && !rootRef.value.contains(e.target)) menuOpen.value = false;
}

onMounted(() => document.addEventListener("click", onClickOutside));
onBeforeUnmount(() => document.removeEventListener("click", onClickOutside));

const otherColumns = computed(() => props.columns.filter((c) => c.key !== props.currentColumnKey));

const appliedAgo = computed(() => {
  if (!props.candidate.applied_at) return "";
  const diffMs = Date.now() - new Date(props.candidate.applied_at).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return t("pipeline.card.today");
  if (days === 1) return t("pipeline.card.daysAgo", { count: 1 });
  return t("pipeline.card.daysAgo", { count: days });
});

function onDragStart(e) {
  if (props.moving) {
    e.preventDefault();
    return;
  }
  e.dataTransfer.setData("text/plain", String(props.candidate.application_id));
  e.dataTransfer.effectAllowed = "move";
}

function moveTo(column) {
  menuOpen.value = false;
  emit("move", { applicationId: props.candidate.application_id, column });
}
</script>

<template>
  <div
    ref="rootRef"
    :draggable="!moving"
    @dragstart="onDragStart"
    class="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing relative"
    :class="{ 'opacity-50 pointer-events-none': moving }"
  >
    <div class="flex items-start gap-2.5" @click="emit('open', candidate)">
      <!-- Avatar -->
      <div class="w-9 h-9 rounded-full bg-gray-200 shrink-0 flex items-center justify-center overflow-hidden">
        <img v-if="candidate.avatar_url" :src="linkStorageUrl + candidate.avatar_url" class="w-full h-full object-cover" />
        <span v-else class="text-xs font-semibold text-gray-600">{{ candidate.name?.charAt(0)?.toUpperCase() }}</span>
      </div>

      <div class="flex-1 min-w-0 cursor-pointer">
        <div class="text-sm font-semibold text-gray-900 truncate">{{ candidate.name }}</div>
        <div v-if="showJobTitle && candidate.job_post_title" class="text-xs text-blue-600 truncate">
          {{ candidate.job_post_title }}
        </div>
        <div class="text-[11px] text-gray-400 mt-0.5">{{ appliedAgo }}</div>
      </div>

      <!-- Overflow menu (drag & drop fallback) -->
      <button
        @click.stop="menuOpen = !menuOpen"
        class="text-gray-400 hover:text-gray-600 p-1 -mr-1 -mt-1"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 100-4 2 2 0 000 4zM10 12a2 2 0 100-4 2 2 0 000 4zM10 18a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      </button>
    </div>

    <div v-if="menuOpen" @click.stop class="absolute right-2 top-9 z-20 w-48 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
      <div class="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase">{{ t("pipeline.card.moveTo") }}</div>
      <button
        v-for="col in otherColumns"
        :key="col.key"
        @click="moveTo(col)"
        class="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
      >
        {{ col.name || t(col.i18nKey) }}
      </button>

      <div class="border-t border-gray-100">
        <button @click="menuOpen = false; emit('chat', candidate)" class="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
          <svg class="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {{ t("chat.chatButton") }}
        </button>
      </div>
    </div>
  </div>
</template>
