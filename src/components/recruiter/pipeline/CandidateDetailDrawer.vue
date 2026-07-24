<script setup>
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { getWorkerByApplication } from "@/services/applications";
import { usePipelineStore } from "@/stores/pipelineStore";
import {
  getMatchScoreTone,
  mergeMatchSources,
  normalizeMatchFields,
  shouldApplyMatchUpdate,
} from "@/constants/matchScore";
import { getStageColorStyles, resolveStageColor } from "@/constants/pipeline";
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
const matchError = ref(false);

let detailRequestId = 0;
let matchRequestId = 0;

async function loadDetail() {
  const applicationId = props.candidate?.application_id;
  if (!applicationId) return;

  const requestId = ++detailRequestId;
  loading.value = true;
  try {
    const res = await getWorkerByApplication(applicationId);
    if (requestId !== detailRequestId) return;
    detail.value = res.data?.data;
  } catch (err) {
    if (requestId !== detailRequestId) return;
    console.error("[Pipeline] Failed to fetch candidate detail:", err);
  } finally {
    if (requestId === detailRequestId) loading.value = false;
  }
}

async function loadMatchDetail({ silent = false } = {}) {
  const applicationId = props.candidate?.application_id;
  if (!applicationId) return;

  const requestId = ++matchRequestId;
  if (!silent) loadingMatch.value = true;
  matchError.value = false;

  const isStillPending = (match) =>
    !!match &&
    match.match_status === "pending" &&
    match.match_score == null &&
    !match.match_breakdown;

  try {
    // BE GET /match may lazy-compute synchronously, or enqueue then stay pending —
    // retry once so the drawer picks up a freshly computed score.
    const maxAttempts = 2;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const data = await pipelineStore.fetchApplicationMatch(applicationId);
      if (requestId !== matchRequestId) return;

      const incoming = normalizeMatchFields(data || {});
      const baseline = mergeMatchSources(props.candidate, matchDetail.value);

      if (shouldApplyMatchUpdate(incoming, baseline)) {
        matchDetail.value = mergeMatchSources(baseline, incoming);
        emit("match-updated", matchDetail.value);
      }

      const current = mergeMatchSources(props.candidate, matchDetail.value);
      if (!isStillPending(current) || attempt === maxAttempts - 1) break;

      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (requestId !== matchRequestId) return;
    }
  } catch (err) {
    if (requestId !== matchRequestId) return;
    console.warn("[Pipeline] Optional match detail unavailable:", err);
    matchError.value = true;
    // Keep existing matchDetail / list fields — do not clear on refresh failure.
  } finally {
    if (requestId === matchRequestId) loadingMatch.value = false;
  }
}

watch(
  () => [props.open, props.candidate?.application_id],
  ([isOpen, applicationId], previous) => {
    if (!isOpen || !applicationId) return;

    const prevId = previous?.[1];
    const switchedCandidate = prevId != null && String(prevId) !== String(applicationId);

    if (switchedCandidate || !previous) {
      detail.value = null;
      matchDetail.value = null;
      matchError.value = false;
    }

    loadDetail();
    loadMatchDetail({ silent: !switchedCandidate && !!previous && matchDetail.value != null });
  },
  { immediate: true },
);

const matchSource = computed(() => mergeMatchSources(props.candidate, matchDetail.value));

const matchStatus = computed(() => matchSource.value.match_status || "pending");
const matchScore = computed(() =>
  matchSource.value.match_score == null ? null : Math.round(Number(matchSource.value.match_score)),
);
const hasNumericScore = computed(() => matchScore.value != null && !Number.isNaN(matchScore.value));
const matchTone = computed(() => getMatchScoreTone(matchScore.value));

const breakdownRows = computed(() => {
  const b = matchSource.value.match_breakdown;
  if (!b || typeof b !== "object") return [];
  // New scorer: semantic, skills, position, experience, salary, location.
  // Keep education for older persisted scores.
  return [
    { key: "semantic", label: t("pipeline.match.breakdown.semantic"), value: b.semantic },
    { key: "skills", label: t("pipeline.match.breakdown.skills"), value: b.skills },
    { key: "position", label: t("pipeline.match.breakdown.position"), value: b.position },
    { key: "experience", label: t("pipeline.match.breakdown.experience"), value: b.experience },
    { key: "salary", label: t("pipeline.match.breakdown.salary"), value: b.salary },
    { key: "location", label: t("pipeline.match.breakdown.location"), value: b.location },
    { key: "education", label: t("pipeline.match.breakdown.education"), value: b.education },
  ].filter((row) => row.value != null && !Number.isNaN(Number(row.value)));
});

/** Ready/pending numeric score — not insufficient_data (avoid a misleading red 0%). */
const showScoreBlock = computed(
  () => hasNumericScore.value && matchStatus.value !== "insufficient_data",
);

const isInsufficientData = computed(() => matchStatus.value === "insufficient_data");

function breakdownBarClass(value) {
  const n = Number(value);
  if (isInsufficientData.value && (Number.isNaN(n) || n <= 0)) return "bg-gray-300";
  return getMatchScoreTone(value).bar;
}

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

const statusMessage = computed(() => {
  // Avoid "Calculating…" under an already-visible score during soft refresh.
  if (hasNumericScore.value && matchStatus.value === "pending" && loadingMatch.value) {
    return "";
  }
  switch (matchStatus.value) {
    case "pending":
      return hasNumericScore.value ? "" : t("pipeline.match.pending");
    case "insufficient_data":
      return t("pipeline.match.insufficient");
    case "failed":
      return t("pipeline.match.failed");
    default:
      return "";
  }
});

const stageLabel = computed(
  () => props.candidate?.stage_name || props.candidate?.stage_type || "",
);

const stageStyles = computed(() =>
  getStageColorStyles(resolveStageColor(props.candidate || {})),
);

const displayName = computed(() => detail.value?.name || props.candidate?.name || "");
const displayEmail = computed(() => detail.value?.email || props.candidate?.email || "");
const displayAvatar = computed(() => detail.value?.avatar_url || props.candidate?.avatar_url || null);
const displayPhone = computed(() => detail.value?.telephone || detail.value?.phone || "");
const resumeUrl = computed(() => detail.value?.resume_url || props.candidate?.resume_url || null);

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

function refreshMatch() {
  loadMatchDetail({ silent: false });
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
              <img v-if="displayAvatar" :src="linkStorageUrl + displayAvatar" class="w-full h-full object-cover" />
              <span v-else class="text-lg font-semibold text-gray-600">{{ displayName?.charAt(0)?.toUpperCase() }}</span>
            </div>
            <div class="min-w-0">
              <div class="font-semibold text-gray-900 truncate">{{ displayName }}</div>
              <div v-if="displayEmail" class="text-sm text-gray-500 truncate">{{ displayEmail }}</div>
              <div v-if="displayPhone" class="text-sm text-gray-500 truncate">{{ displayPhone }}</div>
              <div v-if="candidate.job_post_title" class="text-xs text-blue-600 truncate mt-0.5">{{ candidate.job_post_title }}</div>
              <span
                v-if="stageLabel"
                class="inline-flex mt-1.5 px-2 py-0.5 rounded border text-[11px] font-medium"
                :style="stageStyles.badge"
              >
                {{ stageLabel }}
              </span>
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
              v-if="resumeUrl"
              :href="linkStorageUrl + resumeUrl"
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
              <div class="flex items-center gap-2">
                <span v-if="loadingMatch" class="text-[11px] text-gray-400">{{ t("pipeline.match.refreshing") }}</span>
                <button
                  type="button"
                  class="text-gray-400 hover:text-gray-600 p-0.5 disabled:opacity-40"
                  :disabled="loadingMatch"
                  :title="t('pipeline.match.refresh')"
                  :aria-label="t('pipeline.match.refresh')"
                  @click="refreshMatch"
                >
                  <svg
                    class="w-3.5 h-3.5"
                    :class="loadingMatch ? 'animate-spin' : ''"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            <p v-if="matchError && !showScoreBlock && !isInsufficientData" class="text-sm text-gray-500">
              {{ t("pipeline.match.refreshFailed") }}
            </p>

            <!-- insufficient_data: explain partial match — never a lone red 0% -->
            <template v-else-if="isInsufficientData">
              <div class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 space-y-1">
                <p class="text-sm font-medium text-amber-800">{{ t("pipeline.match.insufficient") }}</p>
                <p class="text-xs text-amber-700/90">{{ t("pipeline.match.insufficientHint") }}</p>
              </div>

              <div v-if="breakdownRows.length" class="space-y-2.5 pt-1">
                <p class="text-[11px] font-medium text-gray-500 uppercase">{{ t("pipeline.match.partialBreakdown") }}</p>
                <div v-for="row in breakdownRows" :key="row.key">
                  <div class="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{{ row.label }}</span>
                    <span class="font-medium">{{ Math.round(Number(row.value)) }}%</span>
                  </div>
                  <div class="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all"
                      :class="breakdownBarClass(row.value)"
                      :style="{ width: barWidth(row.value) }"
                    />
                  </div>
                </div>
              </div>

              <ul v-if="matchReasons.length" class="space-y-1.5 pt-1">
                <li
                  v-for="(reason, idx) in matchReasons"
                  :key="reasonKey(reason, idx)"
                  class="text-sm text-gray-700 flex gap-2"
                >
                  <span class="text-amber-600 shrink-0">•</span>
                  <span>{{ reasonLabel(reason) }}</span>
                </li>
              </ul>

              <p v-if="computedAtLabel" class="text-[11px] text-gray-400 pt-1">
                {{ t("pipeline.match.computedAt", { date: computedAtLabel }) }}
              </p>
            </template>

            <template v-else-if="showScoreBlock">
              <div class="flex items-end gap-2">
                <span class="text-3xl font-bold leading-none" :class="matchTone.text">{{ matchScore }}%</span>
                <span class="text-sm text-gray-500 pb-0.5">{{ t("pipeline.match.scoreLabel") }}</span>
              </div>

              <p v-if="statusMessage" class="text-sm text-gray-500">
                {{ statusMessage }}
              </p>

              <div v-if="breakdownRows.length" class="space-y-2.5">
                <div v-for="row in breakdownRows" :key="row.key">
                  <div class="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{{ row.label }}</span>
                    <span class="font-medium">{{ Math.round(Number(row.value)) }}%</span>
                  </div>
                  <div class="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all"
                      :class="breakdownBarClass(row.value)"
                      :style="{ width: barWidth(row.value) }"
                    />
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
                    <span v-if="reasonWeight(reason) != null" class="text-xs text-gray-400">
                      ({{ reasonWeight(reason) }}%)
                    </span>
                  </span>
                </li>
              </ul>

              <p v-if="computedAtLabel" class="text-[11px] text-gray-400 pt-1">
                {{ t("pipeline.match.computedAt", { date: computedAtLabel }) }}
              </p>
            </template>

            <template v-else>
              <p class="text-sm text-gray-500">
                {{ statusMessage || t("pipeline.match.failed") }}
              </p>

              <ul v-if="matchReasons.length" class="space-y-1.5 pt-1">
                <li
                  v-for="(reason, idx) in matchReasons"
                  :key="reasonKey(reason, idx)"
                  class="text-sm text-gray-700 flex gap-2"
                >
                  <span class="text-teal-600 shrink-0">•</span>
                  <span>{{ reasonLabel(reason) }}</span>
                </li>
              </ul>
            </template>
          </section>

          <div v-if="loading" class="flex justify-center py-4">
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>

          <div v-else-if="detail?.cover_letter || candidate.cover_letter">
            <h3 class="text-xs font-semibold text-gray-500 uppercase mb-1.5">{{ t("coverLetter") }}</h3>
            <p class="text-sm text-gray-700 whitespace-pre-line">{{ detail?.cover_letter || candidate.cover_letter }}</p>
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
