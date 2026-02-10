<script setup>
import { ref, onMounted, computed } from "vue"
import { useRoute, useRouter } from "vue-router"
import api from "../../services/api"

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const recruiter = ref(null)

const openJobs = computed(() => 
  recruiter.value?.job_posts?.filter(job => job.status === "OPEN") || []
)

const formatSalary = (min, max, currency) => {
  const formatter = new Intl.NumberFormat('en-US')
  return `${formatter.format(min)} - ${formatter.format(max)} ${currency}`
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const goToJob = (jobId) => {
  router.push(`/jobposts/${jobId}`)
}

async function fetchRecruiter() {
  try {
    loading.value = true
    const res = await api.get(`/users/${route.params.id}/recruiters`)
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
  <div class="min-h-screen bg-gray-50">
    <!-- Loading State -->
    <div v-if="loading" class="max-w-6xl mx-auto px-4 py-12">
      <div class="animate-pulse space-y-8">
        <div class="h-48 bg-gray-200 rounded-2xl"></div>
        <div class="h-64 bg-gray-200 rounded-2xl"></div>
      </div>
    </div>

    <!-- Content -->
    <div v-else-if="recruiter" class="max-w-6xl mx-auto px-4 py-8">
      <!-- HERO SECTION -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl shadow-xl p-8 mb-8 text-white">
        <div class="flex flex-col md:flex-row items-start md:items-center gap-6">
          <!-- Company Logo -->
          <div class="h-24 w-24 md:h-32 md:w-32 rounded-2xl overflow-hidden shadow-lg bg-white flex-shrink-0">
            <img
              v-if="recruiter.avatar_url"
              :src="`http://localhost:5000${recruiter.avatar_url}`"
              class="h-full w-full object-cover"
              :alt="recruiter.company_name"
            />
            <div v-else class="h-full w-full flex items-center justify-center text-blue-600 text-3xl font-bold">
              {{ recruiter.company_name?.charAt(0) }}
            </div>
          </div>

          <!-- Company Info -->
          <div class="flex-1">
            <h1 class="text-3xl md:text-4xl font-bold mb-2">
              {{ recruiter.company_name }}
            </h1>
            <div class="flex flex-wrap items-center gap-4 text-blue-100 mb-4">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{{ recruiter.industry }}</span>
              </div>
              <a
                v-if="recruiter.company_website"
                :href="recruiter.company_website"
                target="_blank"
                class="flex items-center gap-2 hover:text-white transition"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span class="underline">Visit Website</span>
              </a>
            </div>

            <!-- Stats -->
            <div class="flex flex-wrap gap-6">
              <div class="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <div class="text-2xl font-bold">{{ openJobs.length }}</div>
                <div class="text-sm text-blue-100">Open Positions</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid md:grid-cols-3 gap-6">
        <!-- LEFT COLUMN - Company Details -->
        <div class="md:col-span-1 space-y-6">
          <!-- About Section -->
          <div class="bg-white rounded-xl shadow-sm p-6">
            <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              About Company
            </h2>
            <p class="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
              {{ recruiter.description || "No description provided." }}
            </p>
          </div>

          <!-- Contact Section -->
          <div class="bg-white rounded-xl shadow-sm p-6">
            <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Information
            </h2>
            <div class="space-y-3">
              <div v-if="recruiter.contact_name" class="flex items-start gap-3">
                <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div>
                  <div class="text-xs text-gray-500">Contact Person</div>
                  <div class="text-sm font-medium text-gray-900">{{ recruiter.contact_name }}</div>
                </div>
              </div>
              <div v-if="recruiter.contact_phone" class="flex items-start gap-3">
                <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div>
                  <div class="text-xs text-gray-500">Phone</div>
                  <div class="text-sm font-medium text-gray-900">{{ recruiter.contact_phone }}</div>
                </div>
              </div>
              <div v-if="recruiter.address" class="flex items-start gap-3">
                <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <div class="text-xs text-gray-500">Address</div>
                  <div class="text-sm text-gray-900">{{ recruiter.address }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN - Job Listings -->
        <div class="md:col-span-2">
          <div class="bg-white rounded-xl shadow-sm p-6">
            <h2 class="text-lg font-semibold mb-6 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Open Positions ({{ openJobs.length }})
            </h2>

            <!-- No Jobs State -->
            <div v-if="!openJobs.length" class="text-center py-12">
              <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p class="text-gray-500 font-medium">No active job postings</p>
              <p class="text-sm text-gray-400 mt-1">Check back later for new opportunities</p>
            </div>

            <!-- Job Cards -->
            <div v-else class="space-y-4">
              <div
                v-for="job in openJobs"
                :key="job.id"
                @click="goToJob(job.id)"
                class="border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
              >
                <div class="flex items-start justify-between mb-3">
                  <div class="flex-1">
                    <h3 class="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition mb-1">
                      {{ job.title }}
                    </h3>
                    <div class="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <div class="flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {{ job.location }}
                      </div>
                      <div class="flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {{ job.employment_type }}
                      </div>
                    </div>
                  </div>
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {{ job.status }}
                  </span>
                </div>

                <p class="text-sm text-gray-600 line-clamp-2 mb-4">
                  {{ job.description }}
                </p>

                <div class="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
                  <div class="flex items-center gap-2 text-green-600 font-semibold text-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ formatSalary(job.salary_min, job.salary_max, job.currency) }}
                  </div>
                  <div class="flex items-center gap-4 text-xs text-gray-500">
                    <div class="flex items-center gap-1">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Posted: {{ formatDate(job.published_at) }}
                    </div>
                    <div class="flex items-center gap-1">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Deadline: {{ formatDate(job.deadline) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="max-w-6xl mx-auto px-4 py-12 text-center">
      <p class="text-gray-500">Failed to load recruiter profile</p>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
