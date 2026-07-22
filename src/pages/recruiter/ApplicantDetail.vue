<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import { getWorkerByApplication } from "@/services/applications";
import api from "@/services/api";
const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const loading = ref(false);
const worker = ref(null);

const notes = ref([]);
const noteInput = ref("");

const linkStorageUrl = import.meta.env.VITE_FILE_STORAGE_URL || "";

function formatAnswer(answer) {
  if (!answer) return "";
  if (typeof answer === "string") return answer;
  if (answer.text !== undefined && answer.text !== null) return String(answer.text);
  return "";
}
async function fetchWorker() {
  try {
    loading.value = true;
    const res = await getWorkerByApplication(route.params.applicationId);
    worker.value = res.data?.data;
    console.log("Worker data:", worker.value);
    console.log("Answers:", worker.value?.answers);
  } catch (err) {
    console.error("Failed to fetch worker detail", err);
  } finally {
    loading.value = false;
  }
}

const APPLICATION_STATUSES = [
  { id: 1, name: "APPLIED", color: "bg-blue-100 shadow-sm text-blue-700" },
  {
    id: 2,
    name: "IN REVIEW",
    color: "bg-yellow-100 shadow-sm text-yellow-700",
  },
  {
    id: 3,
    name: "SHORTLISTED",
    color: "bg-purple-100 shadow-sm text-purple-700",
  },
  { id: 4, name: "REJECTED", color: "bg-red-100 shadow-sm text-red-700" },
  { id: 5, name: "HIRED", color: "bg-green-100 shadow-sm text-green-700" },
];

function getStatusMeta(name) {
  return APPLICATION_STATUSES.find((s) => s.name === name);
}

const showStatusDropdown = ref(false);
const updatingStatus = ref(false);

async function changeStatus(status) {
  if (updatingStatus.value) return;

  try {
    updatingStatus.value = true;
    showStatusDropdown.value = false;

    await api.put(`/job-applications/${route.params.applicationId}/status`, {
      application_status_id: status.id,
    });

    // optimistic update
    worker.value.status = status.name;
    push.success(t("notifications.statusUpdatedSuccessfully") || "Status updated successfully");
  } catch (err) {
    console.error("Failed to update status", err);
    push.error(t("failedToUpdateStatus") || "Failed to update status");
  } finally {
    updatingStatus.value = false;
  }
}

async function fetchNotes() {
  const res = await api.get(
    `/job-applications/${route.params.applicationId}/notes`,
  );
  notes.value = res.data.data || [];
}

async function addNote() {
  if (!noteInput.value.trim()) return;

  loading.value = true;
  await api.post(`/job-applications/${route.params.applicationId}/notes`, {
    note: noteInput.value,
  });
  noteInput.value = "";
  await fetchNotes();
  loading.value = false;
}

onMounted(fetchNotes);
onMounted(fetchWorker);
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-linear-to-r from-blue-600 to-indigo-700 text-white py-6">
      <div class="max-w-6xl mx-auto px-6">
        <button
          @click="router.back()"
          class="text-sm text-white/80 hover:text-white mb-3 flex items-center gap-1"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          {{ $t('back') }}
        </button>
        <h1 class="text-2xl font-bold">{{ $t('candidate') }} {{ $t('Profile') }}</h1>
      </div>
    </div>

    <div class="max-w-6xl mx-auto px-6 py-8">
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <div v-else-if="worker" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Sidebar -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Candidate Card -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex flex-col items-center text-center">
              <div class="w-32 h-32 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden mb-4 shadow-lg">
                <img
                  v-if="worker.avatar_url"
                  :src="linkStorageUrl + worker.avatar_url"
                  class="w-full h-full object-cover"
                  :alt="worker.name"
                />
                <span v-else class="text-4xl font-bold text-white">
                  {{ worker.name?.charAt(0)?.toUpperCase() }}
                </span>
              </div>
              
              <h2 class="text-xl font-bold text-gray-900 mb-1">{{ worker.name }}</h2>
              
              <!-- Status Badge -->
              <div class="relative mb-4">
                <button
                  @click.stop="showStatusDropdown = !showStatusDropdown"
                  :disabled="updatingStatus"
                  class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  :class="getStatusMeta(worker.status)?.color"
                >
                  <!-- Loading Spinner -->
                  <svg v-if="updatingStatus" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  
                  <span>{{ updatingStatus ? 'Updating...' : worker.status }}</span>
                  
                  <svg v-if="!updatingStatus" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <!-- Status Dropdown -->
                <div
                  v-if="showStatusDropdown && !updatingStatus"
                  @click.stop
                  class="absolute left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-white shadow-xl rounded-lg z-50 border border-gray-200 overflow-hidden"
                >
                  <div class="py-1">
                    <button
                      v-for="status in APPLICATION_STATUSES"
                      :key="status.id"
                      @click="changeStatus(status)"
                      class="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between"
                      :class="status.name === worker.status && 'bg-blue-50'"
                    >
                      <span :class="status.name === worker.status && 'font-semibold text-blue-700'">
                        {{ status.name.replace('_', ' ') }}
                      </span>
                      <span v-if="status.name === worker.status" class="text-blue-600">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                        </svg>
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Contact Info -->
              <div class="w-full space-y-2 text-sm text-left border-t pt-4">
                <div class="flex items-center gap-2 text-gray-600">
                  <svg class="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  <span class="break-all">{{ worker.email }}</span>
                </div>
                
                <div v-if="worker.telephone" class="flex items-center gap-2 text-gray-600">
                  <svg class="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                  <span>{{ worker.telephone }}</span>
                </div>

                <div class="flex items-center gap-4 text-gray-600 mt-4 pt-3 border-t flex-wrap justify-around">
                  <a
                    v-if="worker.telephone"
                    :href="`tel:${worker.telephone}`"
                    class="flex items-center justify-center gap-2 text-orange-600 hover:text-orange-700 font-medium text-sm transition-colors"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                    {{ $t('contactActions.call') }}
                  </a>

                  <a
                    v-if="worker.email"
                    :href="`mailto:${worker.email}`"
                    class="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                    {{ $t('contactActions.email') }}
                  </a>

                  <a
                    v-if="worker.telephone"
                    :href="`https://wa.me/${worker.telephone.replace(/\D/g, '')}`"
                    target="_blank"
                    class="flex items-center justify-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm transition-colors"
                  >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.272-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.006a9.87 9.87 0 00-5.031 1.378c-3.055 2.013-5.555 5.169-5.555 8.426 0 5.668 4.616 10.282 10.282 10.282 1.693 0 3.351-.397 4.906-1.158l3.537 1.237-1.297-4.41c.895-1.624 1.414-3.508 1.414-5.524 0-5.668-4.616-10.282-10.282-10.282"/>
                    </svg>
                    {{ $t('contactActions.whatsapp') }}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Resume Download -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              {{ $t('resume') }}
            </h3>

            <div v-if="worker.resume_url" class="space-y-3">
              <p class="text-sm font-medium text-gray-700">
                {{ worker.resume_title || 'Resume.pdf' }}
              </p>
              
              <a
                :href="linkStorageUrl + worker.resume_url"
                target="_blank"
                class="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                {{ $t('viewDownloadResume') }}
              </a>
            </div>

            <div v-else class="text-center py-4">
              <svg class="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p class="text-gray-500 text-sm">{{ $t('noResumeUploaded') }}</p>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Job Post Info -->
          <div v-if="worker.job_post" class="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              Applied for Position
            </h3>
            
            <div class="space-y-3">
              <div>
                <h4 class="text-xl font-bold text-gray-900">{{ worker.job_post.title }}</h4>
                <p v-if="worker.job_post.company_name" class="text-blue-600 font-medium">{{ worker.job_post.company_name }}</p>
              </div>
              
              <div class="flex flex-wrap gap-3 text-sm text-gray-600">
                <div v-if="worker.job_post.location" class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  </svg>
                  {{ worker.job_post.location }}
                </div>
                
                <div v-if="worker.job_post.employment_type" class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  {{ worker.job_post.employment_type }}
                </div>
                
                <div v-if="worker.job_post.salary_min || worker.job_post.salary_max" class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span v-if="worker.job_post.salary_min && worker.job_post.salary_max">
                    ${{ worker.job_post.salary_min }} - ${{ worker.job_post.salary_max }}
                  </span>
                  <span v-else-if="worker.job_post.salary_min">
                    From ${{ worker.job_post.salary_min }}
                  </span>
                  <span v-else>
                    Up to ${{ worker.job_post.salary_max }}
                  </span>
                </div>
              </div>

              <router-link
                :to="`/job/${worker.job_post.id}`"
                target="_blank"
                class="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View Full Job Post
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
              </router-link>
            </div>
          </div>

          <!-- Cover Letter -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
              </svg>
              {{ $t('coverLetter') }}
            </h3>
            
            <div v-if="worker.cover_letter" class="prose max-w-none">
              <p class="text-gray-700 whitespace-pre-line leading-relaxed">
                {{ worker.cover_letter }}
              </p>
            </div>
            
            <div v-else class="text-center py-8">
              <svg class="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p class="text-gray-500">{{ $t('noCoverLetterProvided') }}</p>
            </div>
          </div>

          <!-- Application Questions & Answers -->
          <div v-if="worker.answers?.length" class="bg-white rounded-lg shadow-md p-6">
            <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {{ $t('answers') }}
            </h3>
            
            <div class="space-y-4">
              <div
                v-for="(ans, index) in worker.answers"
                :key="ans.id || ans.question_id || index"
                class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div class="flex items-start gap-3">
                  <div class="shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
                    {{ index + 1 }}
                  </div>
                  
                  <div class="flex-1">
                    <div class="font-medium text-gray-900 mb-1">
                      {{ ans.question_text }}
                    </div>
                    
                    <div class="text-xs text-gray-500 mb-3">
                      <span class="px-2 py-1 bg-gray-100 rounded">
                        {{ ans.question_type?.replace('_', ' ') || 'Text' }}
                      </span>
                    </div>
                    
                    <!-- Multiple Choice Display -->
                    <div v-if="ans.options?.choices?.length" class="space-y-2">
                      <div class="text-xs text-gray-500 font-medium">{{ $t('choices') }}:</div>
                      <div class="flex flex-wrap gap-2">
                        <span
                          v-for="(choice, cIdx) in ans.options.choices"
                          :key="cIdx"
                          class="px-3 py-1.5 text-sm rounded-lg border transition-colors"
                          :class="
                            choice === formatAnswer(ans.answer)
                              ? 'bg-blue-100 text-blue-700 border-blue-300 font-medium'
                              : 'bg-gray-50 text-gray-600 border-gray-200'
                          "
                        >
                          {{ choice }}
                        </span>
                      </div>
                    </div>
                    
                    <!-- Text Answer Display -->
                    <div v-else class="mt-2 text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-line">
                      {{ formatAnswer(ans.answer) || '-' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Internal Notes -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              {{ $t('internalNotes') }}
            </h3>

            <!-- Notes List -->
            <div v-if="notes.length" class="space-y-3 mb-4">
              <div
                v-for="n in notes"
                :key="n.id"
                class="bg-yellow-50 border border-yellow-200 rounded-lg p-3"
              >
                <div class="text-sm text-gray-800">{{ n.note }}</div>
                <div class="text-xs text-gray-500 mt-1">
                  {{ new Date(n.created_at).toLocaleString() }}
                </div>
              </div>
            </div>

            <div v-else class="text-center py-6 mb-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <svg class="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p class="text-sm text-gray-500">No internal notes yet</p>
            </div>

            <!-- Add Note -->
            <div class="space-y-3">
              <textarea
                v-model="noteInput"
                rows="3"
                class="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                :placeholder="$t('addInternalNote')"
              />

              <button
                @click="addNote"
                :disabled="!noteInput.trim() || loading"
                class="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                {{ $t('addNote') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
