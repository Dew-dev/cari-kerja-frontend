<script setup>
import { ref, watch, computed } from "vue";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import { getApplicationTimeline, getApplicationNotes, addApplicationNote } from "@/services/pipeline.api";

const { t } = useI18n();

const props = defineProps({
  applicationId: { type: [String, Number], default: null },
  appliedAt: { type: String, default: null },
});

const events = ref([]);
const loading = ref(false);
const usingFallback = ref(false);
const noteInput = ref("");
const submittingNote = ref(false);

const EVENT_META = {
  applied: { icon: "briefcase", color: "text-blue-600 bg-blue-50" },
  stage_change: { icon: "arrow", color: "text-purple-600 bg-purple-50" },
  note: { icon: "note", color: "text-amber-600 bg-amber-50" },
  communication: { icon: "chat", color: "text-green-600 bg-green-50" },
};

function metaFor(type) {
  return EVENT_META[type] || { icon: "dot", color: "text-gray-500 bg-gray-100" };
}

function sortByDateDesc(list) {
  return [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

async function loadFallbackTimeline() {
  usingFallback.value = true;
  const fallbackEvents = [];

  if (props.appliedAt) {
    fallbackEvents.push({
      id: "applied",
      type: "applied",
      title: t("pipeline.timeline.events.applied"),
      created_at: props.appliedAt,
    });
  }

  try {
    const res = await getApplicationNotes(props.applicationId);
    const notes = res.data?.data || [];
    for (const n of notes) {
      fallbackEvents.push({
        id: `note-${n.id}`,
        type: "note",
        title: t("pipeline.timeline.events.note"),
        description: n.note,
        created_at: n.created_at,
        actor_name: n.company_name,
      });
    }
  } catch {
    // notes endpoint also unavailable — timeline will just show what we have
  }

  events.value = sortByDateDesc(fallbackEvents);
}

async function fetchTimeline() {
  if (!props.applicationId) return;
  loading.value = true;
  usingFallback.value = false;
  try {
    const res = await getApplicationTimeline(props.applicationId);
    events.value = sortByDateDesc(res.data?.data || []);
  } catch (err) {
    console.warn("[Pipeline] Timeline endpoint unavailable, using fallback:", err?.message);
    await loadFallbackTimeline();
  } finally {
    loading.value = false;
  }
}

watch(() => props.applicationId, fetchTimeline, { immediate: true });

async function submitNote() {
  const note = noteInput.value.trim();
  if (!note || !props.applicationId) return;

  try {
    submittingNote.value = true;
    await addApplicationNote(props.applicationId, note);
    noteInput.value = "";
    push.success(t("pipeline.timeline.noteAdded"));
    await fetchTimeline();
  } catch (err) {
    push.error(err?.response?.data?.message || t("pipeline.timeline.noteFailed"));
  } finally {
    submittingNote.value = false;
  }
}

const hasEvents = computed(() => events.value.length > 0);
</script>

<template>
  <div class="space-y-4">
    <!-- Add note -->
    <div class="space-y-2">
      <textarea
        v-model="noteInput"
        rows="2"
        :placeholder="t('pipeline.timeline.addNotePlaceholder')"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
      <div class="flex justify-end">
        <button
          @click="submitNote"
          :disabled="!noteInput.trim() || submittingNote"
          class="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium px-4 py-1.5 rounded-lg transition-colors"
        >
          {{ submittingNote ? t("pipeline.timeline.saving") : t("pipeline.timeline.addNote") }}
        </button>
      </div>
    </div>

    <div v-if="usingFallback" class="text-[11px] text-gray-400 italic">
      {{ t("pipeline.timeline.fallbackHint") }}
    </div>

    <!-- Timeline -->
    <div v-if="loading" class="flex justify-center py-6">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
    </div>

    <div v-else-if="!hasEvents" class="text-center text-sm text-gray-400 py-6">
      {{ t("pipeline.timeline.empty") }}
    </div>

    <ol v-else class="relative border-l border-gray-200 ml-2 space-y-5">
      <li v-for="event in events" :key="event.id" class="ml-4">
        <span
          class="absolute -left-[27px] flex items-center justify-center w-5 h-5 rounded-full ring-2 ring-white"
          :class="metaFor(event.type).color"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
        </span>

        <div class="text-sm font-medium text-gray-800">{{ event.title }}</div>
        <div v-if="event.description" class="text-sm text-gray-600 mt-0.5 whitespace-pre-line">{{ event.description }}</div>
        <div class="text-xs text-gray-400 mt-0.5">
          {{ new Date(event.created_at).toLocaleString() }}
          <span v-if="event.actor_name"> · {{ event.actor_name }}</span>
        </div>
      </li>
    </ol>
  </div>
</template>
