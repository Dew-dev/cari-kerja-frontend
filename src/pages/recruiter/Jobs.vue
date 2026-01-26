<template>
  <div class="bg-gray-50 min-h-screen py-10">
    <div class="max-w-6xl mx-auto px-4">
      <!-- HEADER -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-xl font-semibold">
            {{ t("jobs") }}
          </h1>
          <p class="text-sm text-gray-500 mt-1">
            Manage your published job vacancies
          </p>
        </div>

        <router-link
          to="/recruiter/jobs/create"
          class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          + {{ t("createjob") }}
        </router-link>
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
          <tbody>
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
              <td class="px-4 py-3 text-right">
                <div class="flex justify-end gap-3">
                  <button class="text-blue-600 hover:underline">View</button>
                  <!-- <router-link
                    :to="`/recruiter/jobs/${job.id}/edit`"
                    class="text-green-600 hover:underline">Edit</router-link> -->
                  <!-- PUBLISH -->
                  <button
                    v-if="job.status_id === 3"
                    class="text-green-600 hover:underline"
                    @click="openConfirmModal(job, 1)"
                  >
                    Publish
                  </button>

                  <!-- CLOSE -->
                  <button
                    v-if="job.status_id === 1"
                    class="text-red-600 hover:underline"
                    @click="openConfirmModal(job, 2)"
                  >
                    Close
                  </button>
                </div>
              </td>
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
              page === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'hover:bg-gray-100'
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
              p === page
                ? 'bg-blue-600 text-white border-blue-600'
                : 'hover:bg-gray-100'
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
              page === totalPages
                ? 'text-gray-400 cursor-not-allowed'
                : 'hover:bg-gray-100'
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
      {{
        nextStatus === 1
          ? "Publish Job"
          : "Close Job"
      }}
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
        {{
          nextStatus === 1
            ? "Publish"
            : "Close"
        }}
      </button>
    </div>

  </div>
</div>

</template>


<script setup>
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { getJobPostsSelf } from "../../services/jobposts.api";
import api from "../../services/api";
const { t } = useI18n();
const jobs = ref([]);
const loading = ref(false);
const showConfirmModal = ref(false)
const selectedJob = ref(null)
const nextStatus = ref(null)


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

async function fetchJobs() {
  try {
    loading.value = true;

    const res = await getJobPostsSelf({
      page: page.value,
      limit: limit.value,
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
  selectedJob.value = job
  nextStatus.value = status
  console.log("Selected Job:", selectedJob.value.id, "Next Status:", nextStatus.value)
  showConfirmModal.value = true
}

async function confirmUpdateStatus() {
  try {
    await api.post(`/job-posts/status/${selectedJob.value.id}`, {
      status_id: nextStatus.value,
    })

    // optimistic update
    selectedJob.value.status_id = nextStatus.value
    
    const arr = [
      "OPEN",
      "CLOSED",
      "DRAFT",
      "ARCHIVED"
    ]
    selectedJob.value.status = arr[nextStatus.value - 1];
  } catch (err) {
    console.error("Failed to update job status", err)
    alert("Failed to update job status")
  } finally {
    showConfirmModal.value = false
    selectedJob.value = null
    nextStatus.value = null
  }
}

</script>
