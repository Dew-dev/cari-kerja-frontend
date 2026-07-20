<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import { usePipelineStore } from "@/stores/pipelineStore";
import { useChatStore } from "@/stores/chatStore";
import { getWorkerByApplication } from "@/services/applications";
import { getWorkerById } from "@/services/workers.api";
import { resolveWorkerProfileId, resolveWorkerUserId } from "@/utils/chatIdentity";
import api from "@/services/api";

import PipelineFilters from "@/components/recruiter/pipeline/PipelineFilters.vue";
import PipelineAnalytics from "@/components/recruiter/pipeline/PipelineAnalytics.vue";
import PipelineBoard from "@/components/recruiter/pipeline/PipelineBoard.vue";
import CandidateDetailDrawer from "@/components/recruiter/pipeline/CandidateDetailDrawer.vue";
import StageManagerModal from "@/components/recruiter/pipeline/StageManagerModal.vue";
import BulkActionBar from "@/components/recruiter/communication/BulkActionBar.vue";
import BulkSendModal from "@/components/recruiter/communication/BulkSendModal.vue";
import TemplateManagerModal from "@/components/recruiter/communication/TemplateManagerModal.vue";
import CommunicationHistoryModal from "@/components/recruiter/communication/CommunicationHistoryModal.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const pipelineStore = usePipelineStore();
const chatStore = useChatStore();

const jobPostId = computed(() => route.params.id);
const jobTitle = ref("");
const loadingJob = ref(false);

const drawerCandidate = ref(null);
const drawerOpen = ref(false);
const stageManagerOpen = ref(false);
const chattingId = ref(null);

const bulkSendOpen = ref(false);
const templateManagerOpen = ref(false);
const historyOpen = ref(false);
const bulkMoving = ref(false);

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

async function resolveWorkerIds(candidate) {
  let profileId = resolveWorkerProfileId({
    ...candidate,
    worker: candidate.worker,
    worker_id: candidate.worker_id,
  });
  let userId = resolveWorkerUserId(candidate);

  // Application detail gives workers.id reliably (not users.id)
  if (candidate?.application_id) {
    try {
      const res = await getWorkerByApplication(candidate.application_id);
      const worker = res.data?.data;
      if (worker?.id) profileId = worker.id;
      if (worker?.user_id) userId = worker.user_id;
    } catch (err) {
      console.error("[Pipeline] Failed to resolve worker for chat:", err);
    }
  }

  // Chat start needs users.id — fetch profile if still missing
  if (!userId && profileId) {
    try {
      const res = await getWorkerById(profileId);
      userId = res?.data?.user_id || res?.user_id;
    } catch (err) {
      console.error("[Pipeline] Failed to resolve worker user_id:", err);
    }
  }

  return { userId, profileId };
}

function handleToggleSelect(candidate) {
  pipelineStore.toggleCandidateSelection(candidate.application_id);
}

function handleToggleColumnSelect({ columnKey, selected }) {
  pipelineStore.setColumnSelection(columnKey, selected);
}

function openBulkSend() {
  if (!pipelineStore.selectionIsSingleStage) {
    push.warning(t("communication.bulk.singleStageRequired"));
    return;
  }
  templateManagerOpen.value = false;
  historyOpen.value = false;
  bulkSendOpen.value = true;
}

function openTemplateManager() {
  bulkSendOpen.value = false;
  historyOpen.value = false;
  stageManagerOpen.value = false;
  templateManagerOpen.value = true;
}

function openHistory() {
  bulkSendOpen.value = false;
  templateManagerOpen.value = false;
  historyOpen.value = true;
}

function onBulkSent() {
  pipelineStore.clearCandidateSelection();
}

async function handleBulkMove(column) {
  if (!column || bulkMoving.value) return;
  try {
    bulkMoving.value = true;
    const result = await pipelineStore.moveSelectedCandidates(column);
    if (result.failed && !result.moved) {
      push.error(t("communication.bulk.moveFailed"));
      return;
    }
    push.success(
      t("communication.bulk.moveSuccess", {
        moved: result.moved,
        stage: column.name || column.key,
      }),
    );
    if (result.failed) {
      push.warning(t("communication.bulk.movePartial", { failed: result.failed }));
    }
  } catch (err) {
    push.error(err?.response?.data?.message || t("communication.bulk.moveFailed"));
  } finally {
    bulkMoving.value = false;
  }
}

async function handleChat(candidate) {
  try {
    chattingId.value = candidate.application_id;

    const { userId, profileId } = await resolveWorkerIds(candidate);
    if (!userId) {
      push.error(t("chat.cannotStartChat") || "Cannot identify worker");
      return;
    }

    const payload = {
      worker_id: userId,
      worker_profile_id: profileId,
    };

    const conversationId = await chatStore.startOrOpenConversation(payload);
    router.push(`/chat/${conversationId}`);
  } catch (err) {
    push.error(
      err?.response?.data?.message || t("chat.failedToStartChat") || "Failed to start conversation",
    );
  } finally {
    chattingId.value = null;
  }
}
</script>

<template>
  <div class="bg-gray-50 min-h-screen py-8 pb-28">
    <div class="max-w-7xl mx-auto px-4 space-y-5">
      <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-1"
            @click="router.push('/recruiter/jobs')"
          >
            <i class="pi pi-arrow-left text-xs"></i>
            {{ t("vacancies") }}
          </button>
          <h1 class="text-2xl font-bold text-gray-900">{{ t("pipeline.title") }}</h1>
          <p class="text-sm text-gray-600 mt-1">
            {{ loadingJob ? t("pipeline.subtitle") : jobTitle }}
          </p>
        </div>

        <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            type="button"
            class="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors justify-center"
            @click="openHistory"
          >
            {{ t("communication.history.title") }}
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors justify-center"
            @click="openTemplateManager"
          >
            {{ t("communication.templates.manage") }}
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors justify-center"
            @click="stageManagerOpen = true"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {{ t("pipeline.stageManager.manageButton") }}
          </button>
        </div>
      </div>

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

      <PipelineAnalytics
        :columns="pipelineStore.boardColumns"
        :stage-counts-map="pipelineStore.stageCountsMap"
        :conversion-rates="pipelineStore.analytics.conversion_rates"
        :loading="pipelineStore.loadingAnalytics"
      />

      <PipelineBoard
        :columns="pipelineStore.boardColumns"
        :candidates-by-column="pipelineStore.candidatesByColumn"
        :is-moving="pipelineStore.isMoving"
        :loading="pipelineStore.loadingCandidates"
        :show-job-title="!pipelineStore.isSingleJobMode"
        :is-selected="pipelineStore.isCandidateSelected"
        :is-column-fully-selected="pipelineStore.isColumnFullySelected"
        :is-column-partially-selected="pipelineStore.isColumnPartiallySelected"
        @move="handleMove"
        @open="handleOpenCandidate"
        @chat="handleChat"
        @toggle-select="handleToggleSelect"
        @toggle-column-select="handleToggleColumnSelect"
      />
    </div>

    <BulkActionBar
      v-if="pipelineStore.selectedCount > 0"
      :count="pipelineStore.selectedCount"
      :single-stage="pipelineStore.selectionIsSingleStage"
      :columns="pipelineStore.boardColumns"
      :moving="bulkMoving"
      @clear="pipelineStore.clearCandidateSelection()"
      @send="openBulkSend"
      @move="handleBulkMove"
    />

    <BulkSendModal
      :open="bulkSendOpen"
      :candidates="pipelineStore.selectedCandidates"
      :job-post-id="pipelineStore.activeJobPostId"
      :job-title="jobTitle"
      @close="bulkSendOpen = false"
      @sent="onBulkSent"
      @manage-templates="openTemplateManager"
    />

    <TemplateManagerModal :open="templateManagerOpen" @close="templateManagerOpen = false" />

    <CommunicationHistoryModal
      :open="historyOpen"
      :job-post-id="jobPostId"
      @close="historyOpen = false"
    />

    <CandidateDetailDrawer :open="drawerOpen" :candidate="drawerCandidate" @close="closeDrawer" @chat="handleChat" />

    <StageManagerModal
      :open="stageManagerOpen"
      :job-post-id="pipelineStore.activeJobPostId"
      :stages="pipelineStore.activeJobStages"
      @close="stageManagerOpen = false"
    />
  </div>
</template>
