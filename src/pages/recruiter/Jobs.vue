<template>
  <div class="bg-gray-50 min-h-screen py-10">
    <div class="max-w-6xl mx-auto px-4">
      <!-- HEADER -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-xl font-semibold">
            {{ t("jobs") }}
          </h1>
          <p class="text-sm text-gray-500 mt-1">Manage your job vacancies</p>
        </div>

        <router-link
          to="/recruiter/jobs/create"
          class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          + {{ t("createjob") }}
        </router-link>
      </div>
      <!-- TABS -->
      <div class="mb-6 border-b">
        <div class="flex gap-6 text-sm font-medium">
          <button
            @click="activeTab = 'active', fetchJobs()"
            :class="
              activeTab === 'active'
                ? 'border-b-2 border-blue-600 pb-2 text-blue-600'
                : 'pb-2 text-gray-500 hover:text-gray-700'
            "
          >
            Active Jobs
          </button>

          <button
            @click="activeTab = 'archived', fetchJobs()"
            :class="
              activeTab === 'archived'
                ? 'border-b-2 border-blue-600 pb-2 text-blue-600'
                : 'pb-2 text-gray-500 hover:text-gray-700'
            "
          >
            Archived Jobs
          </button>
        </div>
      </div>
      <!-- TABLE CARD -->
      <div class="bg-white border rounded-lg shadow-sm overflow-hidden">
        <!-- TABLE -->
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-600">
            <tr>
              <th class="px-4 py-3 text-left">Job</th>
              <th class="px-4 py-3 text-left">Location</th>
              <th class="px-4 py-3 text-left">Salary</th>
              <th class="px-4 py-3 text-left">Status</th>
              <th class="px-4 py-3 text-left">Applicants</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody v-if="jobs.length > 0 && !loading">
            <tr
              v-for="job in jobs"
              :key="job.id"
              class="border-t hover:bg-gray-50 transition"
            >
              <!-- JOB -->
              <td class="px-4 py-3">
                <div class="font-medium text-gray-900">
                  {{ job.title }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ job.employment_type }} · {{ job.experience_level }}
                </div>
                <div class="text-xs text-gray-400">
                  Created {{ formatDate(job.created_at) }}
                </div>
              </td>

              <!-- LOCATION -->
              <td class="px-4 py-3 text-gray-700">
                {{ job.location }}
              </td>

              <!-- SALARY -->
              <td class="px-4 py-3 text-gray-700">
                {{ formatSalary(job) }}
              </td>

              <!-- STATUS -->
              <td class="px-4 py-3">
                <span
                  class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md"
                  :class="statusClass(job.status)"
                >
                  {{ job.status }}
                </span>
              </td>

              <!-- APPLICANTS -->
              <td class="px-4 py-3 text-gray-700">
                {{ job.applications }}
              </td>

              <!-- ACTIONS -->
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <!-- ACTIVE TAB -->
                  <template v-if="activeTab === 'active'">
                    <!-- VIEW -->
                    <button
                      title="View job"
                      class="action-btn text-blue-600 hover:bg-blue-200 border rounded-full p-1"
                    >
                      <i class="pi pi-eye"></i>
                    </button>

                    <!-- EDIT -->
                    <router-link
                      :to="`/recruiter/jobs/${job.id}/edit`"
                      title="Edit job"
                      class="action-btn text-green-600 hover:bg-emerald-200 border rounded-full p-1"
                    >
                      <i class="pi pi-pencil"></i>
                    </router-link>

                    <!-- APPLICANTS -->
                    <button
                      title="View applicants"
                      @click="
                        $router.push(`/recruiter/jobs/${job.id}/applicants`)
                      "
                      class="action-btn text-indigo-600 hover:bg-indigo-200 border rounded-full p-1"
                    >
                      <i class="pi pi-users"></i>
                    </button>

                    <!-- DUPLICATE -->
                    <button
                      title="Duplicate job"
                      @click="duplicateJob(job.id)"
                      class="action-btn text-purple-600 hover:bg-purple-200 border rounded-full p-1"
                    >
                      <i class="pi pi-copy"></i>
                    </button>

                    <!-- ARCHIVE -->
                    <button
                      title="Archive job"
                      @click="archiveJob(job.id)"
                      class="action-btn text-gray-600 hover:bg-gray-200 border rounded-full p-1"
                    >
                      <i class="pi pi-folder"></i>
                    </button>

                    <!-- PUBLISH -->
                    <button
                      v-if="job.status_id === 3"
                      title="Publish job"
                      @click="openConfirmModal(job, 1)"
                      class="action-btn text-green-600 hover:bg-green-200 border rounded-full p-1"
                    >
                      <i class="pi pi-upload"></i>
                    </button>

                    <!-- CLOSE -->
                    <button
                      v-if="job.status_id === 1"
                      title="Close job"
                      @click="openConfirmModal(job, 2)"
                      class="action-btn text-red-600 hover:bg-red-200 border rounded-full p-1"
                    >
                      <i class="pi pi-times-circle"></i>
                    </button>
                  </template>

                  <!-- ARCHIVED TAB -->
                  <template v-else>
                    <!-- RESTORE -->
                    <button
                      title="Restore job"
                      @click="restoreJob(job.id)"
                      class="action-btn text-green-600 hover:bg-green-200 border rounded-full p-1"
                    >
                      <i class="pi pi-undo"></i>
                    </button>

                    <!-- DUPLICATE -->
                    <button
                      title="Duplicate job"
                      @click="duplicateJob(job.id)"
                      class="action-btn text-purple-600 hover:bg-purple-200 border rounded-full p-1"
                    >
                      <i class="pi pi-copy"></i>
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
          <tbody v-else-if="loading">
            <tr>
              <td colspan="6" class="px-4 py-6 text-center text-gray-500">
                Loading...
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td v-if="activeTab == 'archived'" colspan="6" class="px-4 py-6 text-center text-gray-500">
                No archived jobs found.
              </td>
              <td v-else colspan="6" class="px-4 py-6 text-center text-gray-500">
                No active jobs found. Create your first job posting!</td> 
            </tr>
          </tbody>
        </table>
      </div>
      <!-- PAGINATION -->
      <div
        v-if="totalPages > 1"
        class="flex items-center justify-between mt-6 text-sm"
      >
        <p class="text-gray-500">Page {{ page }} of {{ totalPages }}</p>

        <div class="flex gap-1">
          <!-- PREV -->
          <button
            @click="changePage(page - 1)"
            :disabled="page === 1"
            class="px-3 py-1.5 border rounded-md"
            :class="
              (page === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'hover:bg-gray-100',
              loading ? 'opacity-50 cursor-not-allowed' : '')
            "
          >
            Prev
          </button>

          <!-- NUMBERS -->
          <button
            v-for="p in totalPages"
            :key="p"
            @click="changePage(p)"
            class="px-3 py-1.5 border rounded-md"
            :class="
              (p === page
                ? 'bg-blue-600 text-white border-blue-600'
                : 'hover:bg-gray-100',
              loading ? 'opacity-50 cursor-not-allowed' : '')
            "
          >
            {{ p }}
          </button>

          <!-- NEXT -->
          <button
            @click="changePage(page + 1)"
            :disabled="page === totalPages"
            class="px-3 py-1.5 border rounded-md"
            :class="
              (page === totalPages
                ? 'text-gray-400 cursor-not-allowed'
                : 'hover:bg-gray-100',
              loading ? 'opacity-50 cursor-not-allowed' : '')
            "
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
  <!-- CONFIRM MODAL -->
  <div
    v-if="showConfirmModal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
  >
    <div class="bg-white rounded-lg shadow-lg w-full max-w-sm p-6">
      <!-- TITLE -->
      <h3 class="text-lg font-semibold text-gray-900">
        {{ nextStatus === 1 ? "Publish Job" : "Close Job" }}
      </h3>

      <!-- MESSAGE -->
      <p class="text-sm text-gray-600 mt-2">
        {{
          nextStatus === 1
            ? "Are you sure you want to publish this job?"
            : "Are you sure you want to close this job?"
        }}
      </p>

      <!-- ACTIONS -->
      <div class="mt-6 flex justify-end gap-3">
        <button
          @click="showConfirmModal = false"
          class="px-4 py-2 text-sm rounded-md border hover:bg-gray-100"
        >
          Cancel
        </button>

        <button
          @click="confirmUpdateStatus"
          :class="
            nextStatus === 1
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-red-600 hover:bg-red-700'
          "
          class="px-4 py-2 text-sm text-white rounded-md"
        >
          {{ nextStatus === 1 ? "Publish" : "Close" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { getJobPostsSelf } from "../../services/jobposts.api";
import { useRouter } from "vue-router";
import api from "../../services/api";

const activeTab = ref("active"); // active | archived

const router = useRouter();
const { t } = useI18n();
const jobs = ref([]);
const loading = ref(false);
const showConfirmModal = ref(false);
const selectedJob = ref(null);
const nextStatus = ref(null);

const page = ref(1);
const limit = ref(5);
const totalPages = ref(1);

function statusClass(status) {
  switch (status) {
    case "OPEN":
      return "bg-green-100 text-green-800";
    case "DRAFT":
      return "bg-yellow-100 text-yellow-800";
    case "CLOSED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

async function archiveJob(jobId) {
  if (!confirm("Archive this job?")) return;
  await api.post(`/job-posts/${jobId}/archive`, {}, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  fetchJobs();
}

async function restoreJob(jobId) {
  await api.post(`/job-posts/${jobId}/restore`, {}, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  } );
  fetchJobs();
}

async function fetchJobs() {
  try {
    loading.value = true;

    const res = await getJobPostsSelf({
      page: page.value,
      limit: limit.value,
      archive: activeTab.value === "archived" ? true : false,
    });

    jobs.value = res.data?.data || [];
    totalPages.value = res.data?.meta?.totalPage || 1;
  } catch (err) {
    console.error("Failed to fetch recruiter jobs", err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchJobs();
});
function formatSalary(job) {
  if (!job.salary_min || !job.salary_max) return "—";
  return `${job.salary_min} - ${job.salary_max} ${job.currency}`;
}

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function changePage(p) {
  if (p < 1 || p > totalPages.value) return;
  page.value = p;
  fetchJobs();
}

function openConfirmModal(job, status) {
  selectedJob.value = job;
  nextStatus.value = status;
  console.log(
    "Selected Job:",
    selectedJob.value.id,
    "Next Status:",
    nextStatus.value,
  );
  showConfirmModal.value = true;
}

async function confirmUpdateStatus() {
  try {
    await api.post(`/job-posts/status/${selectedJob.value.id}`, {
      status_id: nextStatus.value,
    });

    // optimistic update
    selectedJob.value.status_id = nextStatus.value;

    const arr = ["OPEN", "CLOSED", "DRAFT", "ARCHIVED"];
    selectedJob.value.status = arr[nextStatus.value - 1];
  } catch (err) {
    console.error("Failed to update job status", err);
    alert("Failed to update job status");
  } finally {
    showConfirmModal.value = false;
    selectedJob.value = null;
    nextStatus.value = null;
  }
}

async function duplicateJob(jobId) {
  try {
    const res = await api.post(`/job-posts/${jobId}/duplicate`);
    console.log("Duplicate job response:", res);
    const newId = res.data?.data?.id;

    // langsung ke edit
    router.push(`/recruiter/jobs/${newId}/edit`);
  } catch (err) {
    console.error("Duplicate failed", err);
    alert("Failed to duplicate job");
  }
}
</script>
