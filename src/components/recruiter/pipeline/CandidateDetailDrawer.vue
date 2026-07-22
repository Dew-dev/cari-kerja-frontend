<script setup>
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { getWorkerByApplication } from "@/services/applications";
import { usePipelineStore } from "@/stores/pipelineStore";
import { getMatchScoreTone } from "@/constants/matchScore";
import CandidateTimeline from "./CandidateTimeline.vue";

const { t, locale } = useI18n();
const pipelineStore = usePipelineStore();

const props = defineProps({
  candidate: { type: Object, default: null },
  open: { type: Boolean, default: false },
});

const emit = defineEmits(["close", "chat", "match-updated"]);

const linkStorageUrl = import.meta.env.VITE_FILE_STORAGE_URL || "";
const detail = ref(null);
const loading = ref(false);
const matchDetail = ref(null);
const loadingMatch = ref(false);

async function loadDetail() {
  if (!props.candidate?.application_id) return;
  detail.value = null;
  loading.value = true;
  try {
    const res = await getWorkerByApplication(props.candidate.application_id);
    detail.value = res.data?.data;
  } catch (err) {
    console.error("[Pipeline] Failed to fetch candidate detail:", err);
  } finally {
    loading.value = false;
  }
}

async function loadMatchDetail() {
  if (!props.candidate?.application_id) return;
  loadingMatch.value = true;
  try {
    const data = await pipelineStore.fetchApplicationMatch(props.candidate.application_id);
    matchDetail.value = data;
    emit("match-updated", data);
  } catch (err) {
    // List payload already has match fields; detail is optional enrichment.
    console.warn("[Pipeline] Optional match detail unavailable:", err);
    matchDetail.value = null;
  } finally {
    loadingMatch.value = false;
  }
}

watch(
  () => [props.open, props.candidate?.application_id],
  ([isOpen]) => {
    if (isOpen) {
      matchDetail.value = null;
      loadDetail();
      loadMatchDetail();
    }
  },
  { immediate: true },
);

const matchSource = computed(() => matchDetail.value || props.candidate || {});

const matchStatus = computed(() => matchSource.value.match_status || "pending");
const matchScore = computed(() =>
  matchSource.value.match_score == null ? null : Math.round(Number(matchSource.value.match_score)),
);
const matchTone = computed(() => getMatchScoreTone(matchScore.value));

const breakdownRows = computed(() => {
  const b = matchSource.value.match_breakdown;
  if (!b || typeof b !== "object") return [];
  return [
    { key: "semantic", label: t("pipeline.match.breakdown.semantic"), value: b.semantic },
    { key: "skills", label: t("pipeline.match.breakdown.skills"), value: b.skills },
    { key: "experience", label: t("pipeline.match.breakdown.experience"), value: b.experience },
    { key: "education", label: t("pipeline.match.breakdown.education"), value: b.education },
  ].filter((row) => row.value != null);
});

const matchReasons = computed(() => {
  const list = matchSource.value.match_reasons;
  return Array.isArray(list) ? list : [];
});

const computedAtLabel = computed(() => {
  const raw = matchSource.value.match_computed_at;
  if (!raw) return "";
  try {
    return new Date(raw).toLocaleString(locale.value || undefined);
  } catch {
    return String(raw);
  }
});

function reasonKey(reason, idx) {
  return reason.code || reason.type || idx;
}

function reasonLabel(reason) {
  return reason.label || reason.code || reason.type || "";
}

function reasonWeight(reason) {
  if (reason.weight != null) return reason.weight;
  if (reason.score != null) return Math.round(Number(reason.score));
  return null;
}

function barWidth(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "0%";
  return `${Math.min(100, Math.max(0, n))}%`;
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="fixed inset-0 bg-black/40 z-40" @click="emit('close')"></div>
    </Transition>

    <Transition name="slide">
      <aside
        v-if="open && candidate"
        class="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-50 flex flex-col"
      >
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 class="text-base font-semibold text-gray-900">{{ t("pipeline.drawer.title") }}</h2>
          <button type="button" class="text-gray-400 hover:text-gray-600" @click="emit('close')">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <div class="flex items-center gap-3">
            <div class="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
              <img v-if="candidate.avatar_url" :src="linkStorageUrl + candidate.avatar_url" class="w-full h-full object-cover" />
              <span v-else class="text-lg font-semibold text-gray-600">{{ candidate.name?.charAt(0)?.toUpperCase() }}</span>
            </div>
            <div class="min-w-0">
              <div class="font-semibold text-gray-900 truncate">{{ candidate.name }}</div>
              <div class="text-sm text-gray-500 truncate">{{ candidate.email }}</div>
              <div v-if="candidate.job_post_title" class="text-xs text-blue-600 truncate mt-0.5">{{ candidate.job_post_title }}</div>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition"
              @click="emit('chat', { ...candidate, worker_id: detail?.id || candidate.worker_id, worker: detail || candidate.worker })"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {{ t("chat.chatButton") }}
            </button>

            <a
              v-if="detail?.resume_url"
              :href="linkStorageUrl + detail.resume_url"
              target="_blank"
              class="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {{ t("viewResume") }}
            </a>
          </div>

          <!-- AI Match section -->
          <section class="rounded-lg border border-gray-200 p-4 space-y-3">
            <div class="flex items-center justify-between gap-2">
              <h3 class="text-xs font-semibold text-gray-500 uppercase">{{ t("pipeline.match.sectionTitle") }}</h3>
              <span v-if="loadingMatch" class="text-[11px] text-gray-400">{{ t("pipeline.match.refreshing") }}</span>
            </div>

            <div v-if="matchStatus === 'ready' && matchScore != null" class="space-y-3">
              <div class="flex items-end gap-2">
                <span class="text-3xl font-bold leading-none" :class="matchTone.text">{{ matchScore }}%</span>
                <span class="text-sm text-gray-500 pb-0.5">{{ t("pipeline.match.scoreLabel") }}</span>
              </div>

              <div v-if="breakdownRows.length" class="space-y-2.5">
                <div v-for="row in breakdownRows" :key="row.key">
                  <div class="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{{ row.label }}</span>
                    <span class="font-medium">{{ Math.round(Number(row.value)) }}%</span>
                  </div>
                  <div class="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div class="h-full rounded-full transition-all" :class="matchTone.bar" :style="{ width: barWidth(row.value) }" />
                  </div>
                </div>
              </div>

              <ul v-if="matchReasons.length" class="space-y-1.5 pt-1">
                <li
                  v-for="(reason, idx) in matchReasons"
                  :key="reasonKey(reason, idx)"
                  class="text-sm text-gray-700 flex gap-2"
                >
                  <span class="text-teal-600 shrink-0">•</span>
                  <span>
                    {{ reasonLabel(reason) }}
                    <span v-if="reasonWeight(reason) != null" class="text-xs text-gray-400">({{ reasonWeight(reason) }})</span>
                  </span>
                </li>
              </ul>

              <p v-if="computedAtLabel" class="text-[11px] text-gray-400 pt-1">
                {{ t("pipeline.match.computedAt", { date: computedAtLabel }) }}
              </p>
            </div>

            <p v-else-if="matchStatus === 'pending'" class="text-sm text-gray-500">
              {{ t("pipeline.match.pending") }}
            </p>
            <p v-else-if="matchStatus === 'insufficient_data'" class="text-sm text-amber-700">
              {{ t("pipeline.match.insufficient") }}
            </p>
            <p v-else class="text-sm text-gray-500">
              {{ t("pipeline.match.failed") }}
            </p>
          </section>

          <div v-if="loading" class="flex justify-center py-4">
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>

          <div v-else-if="detail?.cover_letter">
            <h3 class="text-xs font-semibold text-gray-500 uppercase mb-1.5">{{ t("coverLetter") }}</h3>
            <p class="text-sm text-gray-700 whitespace-pre-line">{{ detail.cover_letter }}</p>
          </div>

          <div>
            <h3 class="text-xs font-semibold text-gray-500 uppercase mb-2">{{ t("pipeline.timeline.title") }}</h3>
            <CandidateTimeline :application-id="candidate.application_id" :applied-at="candidate.applied_at" />
          </div>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
