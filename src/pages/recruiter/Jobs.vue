<template>
  <div class="bg-gray-50 min-h-full py-10">
    <div class="max-w-6xl mx-auto px-4">
      <!-- HEADER -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-xl font-semibold">
            {{ t("jobs") }}
          </h1>
          <p class="text-sm text-gray-500 mt-1">{{ t("managejobs") }}</p>
        </div>

        <router-link
          to="/recruiter/jobs/create"
          class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          + {{ t("createjob") }}
        </router-link>
      </div>
      <!-- TABS -->
      <div class="mb-6 border-b border-gray-300 pb-2">
        <div class="flex gap-6 text-sm font-medium">
          <button
            @click="setActiveTab('active')"
            :class="
              activeTab === 'active'
                ? 'border-b-2 border-blue-600 pb-2 text-blue-600'
                : 'pb-2 text-gray-500 hover:text-gray-700'
            "
          >
            {{ t("activeJobs") }} ({{ jobCounter }})
          </button>

          <button
            @click="setActiveTab('archived')"
            :class="
              activeTab === 'archived'
                ? 'border-b-2 border-blue-600 pb-2 text-blue-600'
                : 'pb-2 text-gray-500 hover:text-gray-700'
            "
          >
            {{ t("archivedJobs") }} ({{ archivedJobCounter }})
          </button>
        </div>
      </div>
      <!-- TABLE CARD -->
      <div class="bg-white shadow-md rounded-lg overflow-hidden">
        <!-- TABLE -->
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-600">
            <tr>
              <th class="px-4 py-3 text-left">{{ t("job_title") }}</th>
              <th class="px-4 py-3 text-left">{{ t("location") }}</th>
              <th class="px-4 py-3 text-left">{{ t("salary") }}</th>
              <th class="px-4 py-3 text-left">{{ t("status") }}</th>
              <th class="px-4 py-3 text-left">{{ t("applicants") }}</th>
              <th class="px-4 py-3 text-right">{{ t("actions") }}</th>
            </tr>
          </thead>
          <tbody v-if="jobs.length > 0 && !loading">
            <tr
              v-for="job in jobs"
              :key="job.id"
              class="shadow-sm hover:bg-gray-50 transition"
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
                      @click="$router.push(`/jobposts/${job.id}`)"
                      class="action-btn text-blue-600 hover:bg-blue-200 border border-blue-600 shadow-sm rounded-full p-1"
                    >
                      <i class="pi pi-eye"></i>
                    </button>

                    <!-- EDIT -->
                    <router-link
                      :to="`/recruiter/jobs/${job.id}/edit`"
                      title="Edit job"
                      class="action-btn text-green-600 hover:bg-emerald-200 border border-green-600 shadow-sm rounded-full p-1"
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
                      @click="openActionModal(job, 'duplicate')"
                      class="action-btn text-purple-600 hover:bg-purple-200 border rounded-full p-1"
                    >
                      <i class="pi pi-copy"></i>
                    </button>

                    <!-- ARCHIVE -->
                    <button
                      title="Archive job"
                      @click="openActionModal(job, 'archive')"
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
                      @click="openActionModal(job, 'restore')"
                      class="action-btn text-green-600 hover:bg-green-200 border rounded-full p-1"
                    >
                      <i class="pi pi-undo"></i>
                    </button>

                    <!-- DUPLICATE -->
                    <button
                      title="Duplicate job"
                      @click="openActionModal(job, 'duplicate')"
                      class="action-btn text-purple-600 hover:bg-purple-200 border rounded-full p-1"
                    >
                      <i class="pi pi-copy"></i>
                    </button>

                    <!-- DELETE -->
                    <button
                      title="Delete job"
                      @click="openActionModal(job, 'delete')"
                      class="action-btn text-red-600 hover:bg-red-200 border rounded-full p-1"
                    >
                      <i class="pi pi-trash"></i>
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
          <tbody v-else-if="loading">
            <tr>
              <td colspan="6" class="px-4 py-6 text-center text-gray-500">
                {{ t("loadingJobs") }}
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td
                v-if="activeTab == 'archived'"
                colspan="6"
                class="px-4 py-6 text-center text-gray-500"
              >
                {{ $t('noArchivedJobs') }}
              </td>
              <td
                v-else
                colspan="6"
                class="px-4 py-6 text-center text-gray-500"
              >
                {{ $t('noActiveJobs') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- PAGINATION -->
      <div
        v-if="totalPages"
        class="flex items-center justify-between mt-6 text-sm"
      >
        <p class="text-gray-500">Page {{ page }} of {{ totalPages }}</p>

        <div class="flex gap-1">
          <!-- PREV -->
          <button
            @click="changePage(page - 1)"
            :disabled="page === 1"
            class="px-3 py-1.5 border border-gray-300 shadow-sm rounded-md"
            :class="[
              page === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'hover:bg-gray-100',
              loading ? 'opacity-50 cursor-not-allowed' : '',
            ]"
          >
            Prev
          </button>

          <!-- NUMBERS -->
          <button
            v-for="p in totalPages"
            :key="p"
            @click="changePage(p)"
            class="px-3 py-1.5 border border-gray-300 shadow-sm rounded-md"
            :class="[
              p === page
                ? 'bg-blue-600 text-white border-blue-600'
                : 'hover:bg-gray-100',
              loading ? 'opacity-50 cursor-not-allowed' : '',
            ]"
          >
            {{ p }}
          </button>

          <!-- NEXT -->
          <button
            @click="changePage(page + 1)"
            :disabled="page === totalPages"
            class="px-3 py-1.5 border border-gray-300 shadow-sm rounded-md"
            :class="[
              page === totalPages
                ? 'text-gray-400 cursor-not-allowed '
                : 'hover:bg-gray-100',
              loading ? 'opacity-50 cursor-not-allowed' : '',
            ]"
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
        {{ nextStatus === 1 ? $t('publishJob') : $t('closeJob') }}
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
          class="px-4 py-2 text-sm rounded-md border border-gray-300 shadow-sm hover:bg-gray-100"
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
          {{ nextStatus === 1 ? $t('publish') : $t('close') }}
        </button>
      </div>
    </div>
  </div>

  <!-- ARCHIVE / RESTORE / DUPLICATE MODAL -->
  <div
    v-if="showActionModal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
  >
    <div class="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
      <h3 class="text-lg font-semibold text-gray-900">
        <span v-if="actionType === 'archive'">Archive job?</span>
        <span v-else-if="actionType === 'restore'">Restore job?</span>
        <span v-else-if="actionType === 'duplicate'">Duplicate job?</span>
        <span v-else-if="actionType === 'delete'">Delete job?</span>
      </h3>

      <p class="mt-2 text-sm text-gray-600">
        <span v-if="actionType === 'archive'">
          This job will be moved to archived list and hidden from active jobs.
        </span>
        <span v-else-if="actionType === 'restore'">
          This job will be restored to active jobs.
        </span>
        <span v-else-if="actionType === 'duplicate'">
          A copy of this job will be created as a draft.
        </span>
        <span v-else-if="actionType === 'delete'">
          This job will be permanently deleted. This action cannot be undone.
        </span>
      </p>

      <div class="mt-6 flex justify-end gap-3">
        <button
          @click="closeActionModal"
          class="rounded-md border border-gray-300 shadow-sm px-4 py-2 text-sm hover:bg-gray-100"
          :disabled="actionLoading"
        >
          Cancel
        </button>

        <button
          @click="confirmAction"
          class="rounded-md px-4 py-2 text-sm text-white"
          :class="
            actionType === 'archive'
              ? 'bg-gray-700 hover:bg-gray-800'
              : actionType === 'restore'
              ? 'bg-green-600 hover:bg-green-700'
              : actionType === 'delete'
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-purple-600 hover:bg-purple-700'
          "
          :disabled="actionLoading"
        >
          {{ actionLoading ? "Processing..." : "Confirm" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
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
const jobCounter = ref(0);
const archivedJobCounter = ref(0);
const countit = ref(false);
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

const showActionModal = ref(false);
const actionType = ref(null); // 'archive' | 'restore'
// const selectedJob = ref(null);
const actionLoading = ref(false);

function openActionModal(job, type) {
  selectedJob.value = job;
  actionType.value = type;
  showActionModal.value = true;
}

function closeActionModal() {
  showActionModal.value = false;
  selectedJob.value = null;
  actionType.value = null;
}

// async function archiveJob(jobId) {
//   if (!confirm("Archive this job?")) return;
//   await api.post(`/job-posts/${jobId}/archive`, {}, {
//     headers: {
//       Authorization: `Bearer ${localStorage.getItem("token")}`,
//     },
//   });
//   fetchJobs();
// }

// async function restoreJob(jobId) {
//   await api.post(`/job-posts/${jobId}/restore`, {}, {
//     headers: {
//       Authorization: `Bearer ${localStorage.getItem("token")}`,
//     },
//   } );
//   fetchJobs();
// }

async function confirmAction() {
  if (!selectedJob.value) return;

  try {
    actionLoading.value = true;

    if (actionType.value === "archive") {
      await api.post(
        `/job-posts/${selectedJob.value.id}/archive`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
    }
    
    if (actionType.value === "restore") {
      await api.post(
        `/job-posts/${selectedJob.value.id}/restore`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
    }

    if (actionType.value === "duplicate") {
      const res = await api.post(`/job-posts/${selectedJob.value.id}/duplicate`);
      const newId = res.data?.data?.id;
      router.push(`/recruiter/jobs/${newId}/edit`);
      closeActionModal();
      return;
    }

    if (actionType.value === "delete") {
      await api.delete(`/job-posts/${selectedJob.value.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      push.success("Job deleted successfully");
    }

    closeActionModal();
    countit.value = !countit.value;
    fetchJobs(); // refresh table
    archivedJobs(); // refresh archived
    page.value = 1; // reset to first page
  } catch (err) {
    console.error("Action failed", err);
    push.error("Action failed. Please try again.");
  } finally {
    actionLoading.value = false;
  }
}

async function fetchJobs() {
  try {
    loading.value = true;

    const res = await getJobPostsSelf({
      page: page.value,
      limit: limit.value,
    });
    if (!countit.value && activeTab.value === "active") {
      jobs.value = res.data?.data || [];
      totalPages.value = res.data?.meta?.totalPage || 1;
    }
    jobCounter.value = res.data?.meta?.total || 0;
    countit.value = false;
  } catch (err) {
    console.error("Failed to fetch recruiter jobs", err);
  } finally {
    loading.value = false;
  }
}

async function archivedJobs() {
  try {
    const res = await getJobPostsSelf({
      page: page.value,
      limit: limit.value,
      archive: true,
    });
    if (!countit.value && activeTab.value === "archived") {
      jobs.value = res.data?.data || [];
      totalPages.value = res.data?.meta?.totalPage || 1;
    }
    archivedJobCounter.value = res.data?.meta?.total || 0;
    countit.value = false;
  } catch (err) {
    console.error("Failed to count archived jobs", err);
  }
}

onMounted(() => {
  fetchJobs();
  archivedJobs();
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
  console.log("toalPages:", totalPages.value);
  console.log("Changing to page:", page.value);
  if (activeTab.value === "archived") {
    archivedJobs();
  } else {
    fetchJobs();
  }
}

function setActiveTab(tab) {
  if (activeTab.value === tab) return;
  activeTab.value = tab;
  page.value = 1;
  if (tab === "archived") {
    archivedJobs();
  } else {
    fetchJobs();
  }
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
    push.error("Failed to update job status");
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
    push.error("Failed to duplicate job");
  }
}
</script>
