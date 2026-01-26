<script setup>
import { ref, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { getWorkerByApplication } from "@/services/applications"
import ProfileAvatar from "../../components/common/ProfileAvatar.vue"
const route = useRoute()
const router = useRouter()

const loading = ref(false)
const worker = ref(null)

const linkStorageUrl = import.meta.env.VITE_FILE_STORAGE_URL || "";
async function fetchWorker() {
  try {
    loading.value = true
    const res = await getWorkerByApplication(route.params.applicationId)
    worker.value = res.data?.data
  } catch (err) {
    console.error("Failed to fetch worker detail", err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchWorker)
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
            {{ worker.name }}
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
      <span
        v-else
        class="text-sm font-semibold text-gray-700"
      >
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

        <p v-else class="text-gray-500 text-sm">
          No resume uploaded.
        </p>
      </div>

    </div>
  </div>
</template>
