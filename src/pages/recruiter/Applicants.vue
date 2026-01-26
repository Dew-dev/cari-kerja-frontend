<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/services/api";

const route = useRoute();
const router = useRouter();

const applicants = ref([]);
const title = ref("");
const loading = ref(false);

const APPLICATION_STATUSES = [
  { id: 1, name: "APPLIED", color: "bg-blue-50 text-blue-700" },
  { id: 2, name: "IN REVIEW", color: "bg-yellow-50 text-yellow-700" },
  { id: 3, name: "SHORTLISTED", color: "bg-purple-50 text-purple-700" },
  { id: 4, name: "REJECTED", color: "bg-red-50 text-red-700" },
  { id: 5, name: "HIRED", color: "bg-green-50 text-green-700" },
];

function getStatusMeta(statusName) {
  return APPLICATION_STATUSES.find((s) => s.name === statusName);
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

async function updateApplicantStatus(applicant, status) {
  try {
    if (["HIRED", "REJECTED"].includes(applicant.status)) return;

    await api.put(
      `/job-applications/${applicant.application_id}/status`,
      {
        application_status_id: status.id,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );

    // optimistic update
    applicant.status = status.name;
    openStatusDropdown.value = null;
  } catch (err) {
    console.error("Failed to update applicant status", err);
    alert("Failed to update applicant status");
  }
}

async function fetchApplicants() {
  try {
    loading.value = true;
    const res = await api.get(`/job-posts/${route.params.id}/applicants`);
    const job = await api.get(`/job-posts/${route.params.id}`);
    document.title = `Applicants for ${job.data?.data.title} - Recruiter`;
    applicants.value = res.data?.data || [];
    title.value = job.data?.data.title || "";
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
          ← Back
        </button>

        <h1 class="text-xl font-semibold">Applicants for {{ title }}</h1>
      </div>

      <!-- TABLE CARD -->
      <div class="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-600">
            <tr>
              <th class="px-4 py-3 text-left">Candidate</th>
              <th class="px-4 py-3 text-left">Resume</th>
              <th class="px-4 py-3 text-left">Applied At</th>
              <th class="px-4 py-3 text-left">Status</th>
              <th class="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            <!-- LOADING -->
            <tr v-if="loading">
              <td colspan="5" class="px-4 py-6 text-center text-gray-500">
                Loading applicants…
              </td>
            </tr>

            <!-- EMPTY -->
            <tr v-else-if="!applicants.length">
              <td colspan="5" class="px-4 py-6 text-center text-gray-500">
                No applicants yet
              </td>
            </tr>

            <!-- ROW -->
            <tr
              v-for="a in applicants"
              :key="a.id"
              class="border-t hover:bg-gray-50 transition min-h-48"
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
                  View Resume
                </a>
                <span v-else class="text-gray-500 italic"
                  >No Resume provided</span
                >
              </td>

              <td class="px-4 py-9 text-gray-700">
                {{ formatDate(a.applied_at) }}
              </td>

              <td class="px-4 py-9 relative overflow-visible">
                <!-- BADGE -->
                <span
                  class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md cursor-pointer"
                  :class="getStatusMeta(a.status)?.color"
                  @click.stop="openStatusDropdown = a.application_id"
                >
                  {{ a.status }}
                </span>

                <!-- DROPDOWN -->
                <div
                  v-if="openStatusDropdown === a.application_id"
                  ref="dropdownRef"
                  class="absolute left-0 top-0 mt-2 w-44 z-[9999] bg-white border rounded-md shadow-lg z-50 overflow-auto max-h-25"
                >
                  <div
                    v-for="status in APPLICATION_STATUSES"
                    :key="status.id"
                    @click="updateApplicantStatus(a, status)"
                    class="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                    :class="status.name === a.status && 'font-semibold'"
                  >
                    {{ status.name.replace("_", " ") }}
                  </div>
                </div>
              </td>

              <td class="px-4 py-3 text-right"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
