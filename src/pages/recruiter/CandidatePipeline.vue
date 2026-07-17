<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import { usePipelineStore } from "@/stores/pipelineStore";
import { startConversation } from "@/services/chat.api";
import api from "@/services/api";

import PipelineFilters from "@/components/recruiter/pipeline/PipelineFilters.vue";
import PipelineAnalytics from "@/components/recruiter/pipeline/PipelineAnalytics.vue";
import PipelineBoard from "@/components/recruiter/pipeline/PipelineBoard.vue";
import CandidateDetailDrawer from "@/components/recruiter/pipeline/CandidateDetailDrawer.vue";
import StageManagerModal from "@/components/recruiter/pipeline/StageManagerModal.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const pipelineStore = usePipelineStore();

// This page always lives under a specific job post (Vacancies > Active Jobs
// > Candidate Pipeline), so the board is permanently scoped to that job —
// there is no cross-job/global view here.
const jobPostId = computed(() => route.params.id);
const jobTitle = ref("");
const loadingJob = ref(false);

const drawerCandidate = ref(null);
const drawerOpen = ref(false);
const stageManagerOpen = ref(false);
const chattingId = ref(null);

async function loadJob() {
  try {
    loadingJob.value = true;
    const res = await api.get(`/job-posts/${jobPostId.value}`);
    jobTitle.value = res.data?.data?.title || "";
    document.title = `${t("pipeline.title")} - ${jobTitle.value} - Recruiter`;
  } catch (err) {
    console.error("[Pipeline] Failed to fetch job post:", err);
  } finally {
    loadingJob.value = false;
  }
}

async function loadForJob() {
  pipelineStore.setSelectedJobPostIds([jobPostId.value]);
  await Promise.all([loadJob(), pipelineStore.refreshBoard()]);
}

onMounted(loadForJob);

watch(jobPostId, loadForJob);

watch(() => pipelineStore.stageTypeFilter, () => pipelineStore.refreshBoard());

watch(() => pipelineStore.search, () => pipelineStore.fetchCandidates());

function handleSearchUpdate(value) {
  pipelineStore.setSearch(value);
}

function handleStageTypeUpdate(type) {
  pipelineStore.setStageTypeFilter(type);
}

function resetFilters() {
  pipelineStore.setSearch("");
  pipelineStore.setStageTypeFilter(null);
}

async function handleMove({ applicationId, column }) {
  const candidate = pipelineStore.candidates.find((c) => String(c.application_id) === String(applicationId));
  if (!candidate) return;

  try {
    await pipelineStore.moveCandidate(candidate, column);
  } catch (err) {
    push.error(err?.response?.data?.message || t("pipeline.board.moveFailed"));
  }
}

function handleOpenCandidate(candidate) {
  drawerCandidate.value = candidate;
  drawerOpen.value = true;
}

function closeDrawer() {
  drawerOpen.value = false;
}

async function handleChat(candidate) {
  const workerId = candidate.worker_id || candidate.id;
  if (!workerId) {
    push.error(t("chat.cannotStartChat") || "Cannot identify worker");
    return;
  }

  try {
    chattingId.value = candidate.application_id;
    const res = await startConversation({ worker_id: workerId });
    const conversationId = res.data?.data?.id || res.data?.id;
    if (!conversationId) throw new Error("No conversation ID returned");
    router.push(`/chat/${conversationId}`);
  } catch (err) {
    push.error(err?.response?.data?.message || t("chat.failedToStartChat") || "Failed to start conversation");
  } finally {
    chattingId.value = null;
  }
}

</script>

<template>
  <div class="bg-gray-50 min-h-screen py-8">
    <div class="max-w-7xl mx-auto px-4 space-y-5">
      <!-- Header -->
      <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            @click="router.push('/recruiter/jobs')"
            class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-1"
          >
            <i class="pi pi-arrow-left text-xs"></i>
            {{ t("vacancies") }}
          </button>
          <h1 class="text-2xl font-bold text-gray-900">{{ t("pipeline.title") }}</h1>
          <p class="text-sm text-gray-600 mt-1">
            {{ loadingJob ? t("pipeline.subtitle") : jobTitle }}
          </p>
        </div>

        <button
          @click="stageManagerOpen = true"
          class="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {{ t("pipeline.stageManager.manageButton") }}
        </button>
      </div>

      <!-- Filters (scoped to this job — no cross-job position picker) -->
      <PipelineFilters
        locked-position
        :search="pipelineStore.search"
        :stage-type-filter="pipelineStore.stageTypeFilter"
        @update:search="handleSearchUpdate"
        @update:stage-type-filter="handleStageTypeUpdate"
        @reset="resetFilters"
      />

      <div
        v-if="pipelineStore.usingApplicantsFallback || pipelineStore.usingStagesFallback"
        class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
      >
        {{ t("pipeline.board.fallbackHint") }}
      </div>

      <!-- Analytics -->
      <PipelineAnalytics
        :columns="pipelineStore.boardColumns"
        :stage-counts-map="pipelineStore.stageCountsMap"
        :conversion-rates="pipelineStore.analytics.conversion_rates"
        :loading="pipelineStore.loadingAnalytics"
      />

      <!-- Board -->
      <PipelineBoard
        :columns="pipelineStore.boardColumns"
        :candidates-by-column="pipelineStore.candidatesByColumn"
        :is-moving="pipelineStore.isMoving"
        :loading="pipelineStore.loadingCandidates"
        :show-job-title="!pipelineStore.isSingleJobMode"
        @move="handleMove"
        @open="handleOpenCandidate"
        @chat="handleChat"
      />
    </div>

    <!-- Candidate detail drawer -->
    <CandidateDetailDrawer :open="drawerOpen" :candidate="drawerCandidate" @close="closeDrawer" @chat="handleChat" />

    <!-- Stage manager -->
    <StageManagerModal
      :open="stageManagerOpen"
      :job-post-id="pipelineStore.activeJobPostId"
      :stages="pipelineStore.activeJobStages"
      @close="stageManagerOpen = false"
    />
  </div>
</template>
