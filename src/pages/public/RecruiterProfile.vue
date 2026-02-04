<script setup>
import { ref, onMounted } from "vue"
import { useRoute } from "vue-router"
import api from "../../services/api"
import { computed } from "vue";
const openJobs = ref(null);

const route = useRoute()
const loading = ref(false)
const recruiter = ref(null)

async function fetchRecruiter() {
  try {
    loading.value = true
    const res = await api.get(`/users/${route.params.id}/recruiters`)
    openJobs.value = computed(() =>
        res.data?.data.job_posts.filter(job => job.status === "OPEN")
    );
    // console.log("Open jobs:", openJobs.value);
    recruiter.value = res.data?.data
  } catch (err) {
    console.error("Failed to load recruiter profile", err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchRecruiter)
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <div v-if="loading">Loading...</div>

    <div v-else-if="recruiter" class="space-y-8">
      <!-- HEADER -->
      <div class="flex items-center gap-6">
        <div class="h-24 w-24 rounded-full overflow-hidden shadow-md bg-gray-100">
          <img
            v-if="recruiter.avatar_url"
            :src="`http://localhost:5000${recruiter.avatar_url}`"
            class="h-full w-full object-cover"
          />
        </div>

        <div>
          <h1 class="text-2xl font-semibold">
            {{ recruiter.company_name }}
          </h1>
          <p class="text-sm text-gray-500">
            {{ recruiter.industry }}
          </p>

          <a
            v-if="recruiter.company_website"
            :href="recruiter.company_website"
            target="_blank"
            class="text-sm text-blue-600 hover:underline"
          >
            {{ recruiter.company_website }}
          </a>
        </div>
      </div>

      <!-- ABOUT -->
      <section class="rounded-xl shadow-md bg-white p-6">
        <h2 class="text-lg font-semibold mb-2">About Company</h2>
        <p class="text-sm text-gray-700 whitespace-pre-line">
          {{ recruiter.description || "No description provided." }}
        </p>
      </section>

      <!-- CONTACT -->
      <section
        v-if="recruiter.contact_name || recruiter.contact_phone"
        class="rounded-xl shadow-md bg-white p-6"
      >
        <h2 class="text-lg font-semibold mb-2">Contact</h2>
        <p class="text-sm text-gray-700">
          {{ recruiter.contact_name }} 
        </p>
        <p class="text-sm text-gray-700">
          {{ recruiter.contact_phone }}
        </p>
      </section>

      <!-- JOBS -->
      <section class="space-y-4">
        <h2 class="text-lg font-semibold">
          Open Positions
        </h2>

        <div
          v-if="openJobs.value.length"
          class="space-y-3"
        >
          <div
            v-for="job in openJobs.value"
            :key="job.id"
            class="rounded-xl shadow-sm bg-white p-4 hover:shadow-md"
          >
            <h3 class="font-medium text-base">
              {{ job.title }}
            </h3>
            <p class="text-sm text-gray-500">
              {{ job.location }} · {{ job.employment_type }}
            </p>
            <p class="text-xs text-gray-400 mt-1">
              Posted {{ new Date(job.created_at).toLocaleDateString() }}
            </p>
          </div>
        </div>

        <p v-else class="text-sm text-gray-500">
          No active job postings.
        </p>
      </section>
    </div>
  </div>
</template>
