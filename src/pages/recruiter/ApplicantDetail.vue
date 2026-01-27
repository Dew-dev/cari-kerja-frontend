<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getWorkerByApplication } from "@/services/applications";
import api from "@/services/api";
const route = useRoute();
const router = useRouter();

const loading = ref(false);
const worker = ref(null);

const linkStorageUrl = import.meta.env.VITE_FILE_STORAGE_URL || "";
async function fetchWorker() {
  try {
    loading.value = true;
    const res = await getWorkerByApplication(route.params.applicationId);
    worker.value = res.data?.data;
  } catch (err) {
    console.error("Failed to fetch worker detail", err);
  } finally {
    loading.value = false;
  }
}

const APPLICATION_STATUSES = [
  { id: 1, name: "APPLIED", color: "bg-blue-100 shadow-sm text-blue-700" },
  { id: 2, name: "IN REVIEW", color: "bg-yellow-100 shadow-sm text-yellow-700" },
  { id: 3, name: "SHORTLISTED", color: "bg-purple-100 shadow-sm text-purple-700" },
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

    await api.put(`/job-applications/${route.params.applicationId}/status`, {
      application_status_id: status.id,
    });

    // optimistic update
    worker.value.status = status.name;
    showStatusDropdown.value = false;
  } catch (err) {
    console.error("Failed to update status", err);
    alert("Failed to update applicant status");
  } finally {
    updatingStatus.value = false;
  }
}

onMounted(fetchWorker);
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <!-- BACK -->
    <button
      @click="router.back()"
      class="text-sm text-gray-600 hover:text-gray-900 mb-4"
    >
      ← Back
    </button>

    <div v-if="loading">Loading...</div>

    <div v-else-if="worker" class="space-y-6">
      <!-- HEADER -->
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-2xl font-semibold">
            {{ worker.name }} <span class="relative">
            <span
              class="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md cursor-pointer"
              :class="getStatusMeta(worker.status)?.color"
              @click.stop="showStatusDropdown = !showStatusDropdown"
            >
              {{ worker.status }}
            </span>

            <!-- DROPDOWN -->
            <div
              v-if="showStatusDropdown"
              class="absolute right-0 mt-2 w-44 bg-white border rounded-md shadow-lg z-50"
            >
              <div
                v-for="status in APPLICATION_STATUSES"
                :key="status.id"
                @click="changeStatus(status)"
                class="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                :class="status.name === worker.status && 'font-semibold'"
              >
                {{ status.name.replace("_", " ") }}
              </div>
            </div>
          </span>
          </h1>
          <p class="text-gray-600 text-sm">
            {{ worker.email }}
          </p>
          <p v-if="worker.phone" class="text-gray-600 text-sm">
            {{ worker.phone }}
          </p>
          
        </div>

        <div
          class="w-30 h-30 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden"
        >
          <img
            v-if="worker.avatar_url"
            :src="linkStorageUrl + worker.avatar_url"
            class="w-full h-full object-cover"
          />
          <span v-else class="text-[2rem] font-semibold text-gray-700">
            {{ worker.name?.charAt(0)?.toUpperCase() }}
          </span>
        </div>
      </div>

      <!-- META -->
      <div class="flex gap-6 text-sm text-gray-600">
        <div>
          <span class="font-medium text-gray-800">Applied at:</span>
          {{ new Date(worker.applied_at).toLocaleDateString() }}
        </div>
      </div>

      <!-- COVER LETTER -->
      <div class="bg-white border rounded-lg p-4">
        <h2 class="font-semibold mb-2">Cover Letter</h2>
        <p class="text-gray-700 whitespace-pre-line">
          {{ worker.cover_letter || "No cover letter provided." }}
        </p>
      </div>

      <!-- RESUME -->
      <div class="bg-white border rounded-lg p-4">
        <h2 class="font-semibold mb-2">Resume</h2>

        <div v-if="worker.resume_url">
          <p class="text-sm text-gray-600 mb-2">
            {{ worker.resume_title }}
          </p>

          <a
            :href="linkStorageUrl + worker.resume_url"
            target="_blank"
            class="inline-flex items-center text-blue-600 hover:underline text-sm"
          >
            View / Download Resume →
          </a>
        </div>

        <p v-else class="text-gray-500 text-sm">No resume uploaded.</p>
      </div>
    </div>
  </div>
</template>
