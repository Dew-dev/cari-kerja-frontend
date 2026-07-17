<template>
  <div class="bg-white border border-border rounded-md p-4 flex justify-between hover:shadow-sm transition">
    <div class="flex-1">
      <h3 class="font-semibold text-base mb-1">{{ job.title }}</h3>
      <p class="text-sm text-primary">{{ job.company_name || job.company }}</p>
      <p class="text-xs text-muted mt-1">
        {{ job.location }} · {{ job.salary || "Salary not specified" }}
      </p>
    </div>

    <div class="flex flex-col items-end gap-2">
      <div class="flex gap-2">
        <button 
          @click="goToJobDetail"
          class="bg-primary text-white text-sm px-4 py-1.5 rounded hover:bg-blue-700 transition"
        >
          {{ $t("view") || "View" }}
        </button>
        <button 
          @click="handleSaveJob"
          :disabled="isSavingJob"
          :class="[
            'text-sm px-3 py-1.5 rounded transition',
            isSaved
              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
            isSavingJob && 'opacity-50 cursor-not-allowed'
          ]"
          :title="isSaved ? 'Remove from saved' : 'Save job'"
        >
          <svg
            class="w-4 h-4"
            :fill="isSaved ? 'currentColor' : 'none'"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 5a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 19V5z"
            />
          </svg>
        </button>
      </div>
      <span class="text-xs text-muted">{{ job.posted_at }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "@/stores/authStore.js"
import {
  saveJob,
  removeSavedJob,
  removeSavedJobByJobPostId,
  isSavedJobId,
} from "@/services/saved-jobs.api"
import { push } from "notivue"
import { useI18n } from "vue-i18n"

const props = defineProps({ job: Object })
const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()

const isSaved = ref(false)
const savedJobId = ref(null)
const isSavingJob = ref(false)

onMounted(() => {
  const rawSavedId = props.job?.saved_id
  if (isSavedJobId(rawSavedId)) {
    savedJobId.value = rawSavedId
    isSaved.value = true
  } else {
    savedJobId.value = null
    isSaved.value = Boolean(props.job?.saved || rawSavedId)
  }
})

const handleSaveJob = async () => {
  if (!auth.isLoggedIn) {
    router.push({
      path: "/login",
      query: { redirect: router.currentRoute.value.fullPath }
    })
    return
  }

  if (auth.role === "recruiter") {
    push.warning(t("notifications.recruitersCannotSaveJobs"))
    return
  }

  const jobPostId = props.job.id

  try {
    isSavingJob.value = true

    if (isSaved.value) {
      // DELETE butuh saved_jobs.id, bukan job_post_id
      if (savedJobId.value) {
        await removeSavedJob(savedJobId.value)
      } else {
        await removeSavedJobByJobPostId(jobPostId)
      }
      savedJobId.value = null
      isSaved.value = false
      push.success(t("notifications.jobRemovedFromSaved"))
    } else {
      // POST pakai job_post_id
      const res = await saveJob(jobPostId)
      savedJobId.value = res?.data?.id ?? null
      isSaved.value = true
      push.success(t("notifications.jobSavedSuccessfully"))
    }
  } catch (error) {
    console.error("Error saving job:", error)
    push.error(error.response?.data?.message || t("notifications.errorSavingJob"))
  } finally {
    isSavingJob.value = false
  }
}

const goToJobDetail = () => {
  router.push({
    name: "JobDetail",
    params: { id: props.job.id }
  })
}
</script>
