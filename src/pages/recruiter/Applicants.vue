<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import api from "@/services/api";
import { startConversation } from "@/services/chat.api";
import { getJobStages, moveApplicationStage } from "@/services/pipeline.api";
import { getStageColorStyles, resolveStageColor } from "@/constants/pipeline";
import { resolveWorkerProfileId } from "@/utils/chatIdentity";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const applicants = ref([]);
const title = ref("");
const loading = ref(false);

// Stages are customizable per job post — fetched dynamically instead of
// relying on a hardcoded/global status list (see GET /job-posts/:id/stages).
const stages = ref([]);

function getStageMeta(statusName) {
  return stages.value.find((s) => s.name === statusName);
}
const openStatusDropdown = ref(null); // application_id
const dropdownRef = ref(null);

function handleClickOutside(e) {
  if (!dropdownRef.value) return;

  // kalau klik DI DALAM dropdown → abaikan
  if (dropdownRef.value.contains(e.target)) return;

  // klik di luar → tutup
  openStatusDropdown.value = null;
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

async function updateApplicantStatus(applicant, stage) {
  try {
    const currentStage = getStageMeta(applicant.status);
    if (currentStage && ["hired", "rejected"].includes(currentStage.stage_type)) return;

    await moveApplicationStage(applicant.application_id, stage.id);

    // optimistic update
    applicant.status = stage.name;
    openStatusDropdown.value = null;
  } catch (err) {
    console.error("Failed to update applicant status", err);
    push.error(err?.response?.data?.message || t("failedToUpdateStatus"));
  }
}

async function fetchApplicants() {
  try {
    loading.value = true;
    const [res, job, stagesRes] = await Promise.all([
      api.get(`/job-posts/${route.params.id}/applicants`),
      api.get(`/job-posts/${route.params.id}`),
      getJobStages(route.params.id),
    ]);
    document.title = `Applicants for ${job.data?.data.title} - Recruiter`;
    applicants.value = res.data?.data || [];
    title.value = job.data?.data.title || "";
    stages.value = stagesRes.data?.data || [];
  } catch (err) {
    console.error("Failed to fetch applicants", err);
  } finally {
    loading.value = false;
  }
}

onMounted(fetchApplicants);

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const chattingId = ref(null); // track which applicant is loading chat

async function startChat(applicant) {
  // API expects workers.id (profile), not users.id
  const workerId =
    resolveWorkerProfileId(applicant) ||
    applicant.worker_id ||
    applicant.worker?.id ||
    applicant.id;
  if (!workerId) {
    push.error(t("chat.cannotStartChat") || "Cannot identify worker");
    return;
  }

  try {
    chattingId.value = applicant.application_id;
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
const linkStorageUrl = import.meta.env.VITE_FILE_STORAGE_URL || "";
</script>

<template>
  <div class="bg-gray-50 min-h-screen py-10">
    <div class="max-w-6xl mx-auto px-4">
      <!-- HEADER -->
      <div class="flex items-center gap-4 mb-6">
        <button
          @click="router.back()"
          class="text-sm text-gray-600 hover:underline"
        >
          ← {{ $t('back') }}
        </button>

        <h1 class="text-xl font-semibold">{{ $t('applicants') }} for {{ title }}</h1>
      </div>

      <!-- TABLE CARD -->
      <div class="bg-white shadow-md rounded-lg overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-600">
            <tr>
              <th class="px-4 py-3 text-left">{{ $t('candidate') }}</th>
              <th class="px-4 py-3 text-left">{{ $t('resume') }}</th>
              <th class="px-4 py-3 text-left">{{ $t('applied_at') }}</th>
              <th class="px-4 py-3 text-left">{{ $t('status') }}</th>
              <th class="px-4 py-3 text-right">{{ $t('actions') }}</th>
            </tr>
          </thead>

          <tbody>
            <!-- LOADING -->
            <tr v-if="loading">
              <td colspan="5" class="px-4 py-6 text-center text-gray-500">
                {{ $t('loadingApplicants') }}
              </td>
            </tr>

            <!-- EMPTY -->
            <tr v-else-if="!applicants.length">
              <td colspan="5" class="px-4 py-6 text-center text-gray-500">
                {{ $t('noApplicantsYet') }}
              </td>
            </tr>

            <!-- ROW -->
            <tr
              v-for="a in applicants"
              :key="a.id"
              class="shadow-sm hover:bg-gray-50 transition min-h-48"
            >
              <td class="px-4 py-9">
                <div class="font-medium text-gray-900">
                  {{ a.name }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ a.email }}
                </div>
              </td>

              <td class="px-4 py-9 text-gray-700">
                <a
                  v-if="a.resume_url"
                  :href="linkStorageUrl + a.resume_url"
                  target="_blank"
                  class="text-blue-600 hover:underline"
                >
                  {{ $t('viewResume') }}
                </a>
                <span v-else class="text-gray-500 italic"
                  >{{ $t('noResumeProvided') }}</span
                >
              </td>

              <td class="px-4 py-9 text-gray-700">
                {{ formatDate(a.applied_at) }}
              </td>

              <td class="px-4 py-9 relative overflow-visible">
                <!-- BADGE -->
                <span
                  class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md cursor-pointer"
                  :style="getStageColorStyles(resolveStageColor(getStageMeta(a.status))).badge"
                  @click.stop="openStatusDropdown = a.application_id"
                >
                  {{ a.status }}
                </span>

                <!-- DROPDOWN -->
                <div
                  v-if="openStatusDropdown === a.application_id"
                  ref="dropdownRef"
                  class="absolute left-0 top-0 mt-2 w-44 z-[9999] bg-white shadow-lg rounded-md z-50 overflow-auto max-h-25"
                >
                  <div
                    v-for="stage in stages"
                    :key="stage.id"
                    @click="updateApplicantStatus(a, stage)"
                    class="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer "
                    :class="stage.name === a.status && 'font-semibold'"
                  >
                    {{ stage.name }}
                  </div>
                </div>
              </td>

              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click.stop="startChat(a)"
                    :disabled="chattingId === a.application_id"
                    class="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition disabled:opacity-50"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {{ chattingId === a.application_id ? '...' : $t('chat.chatButton') }}
                  </button>
                  <button
                    @click.stop="
                      $router.push(
                        `/recruiter/jobs/${route.params.id}/applicants/${a.application_id}`,
                      )
                    "
                    class="text-blue-600 text-sm hover:underline"
                  >
                    View
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
