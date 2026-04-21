<script setup>
import { ref, onMounted, computed } from "vue"
import { useRoute, useRouter } from "vue-router"
import api from "@/services/api"

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const recruiter = ref(null)

const PAGE_SIZE = 5
const currentPage = ref(1)

const openJobs = computed(() =>
  recruiter.value?.job_posts?.filter(job => job.status === "OPEN") || []
)

const totalPages = computed(() => Math.ceil(openJobs.value.length / PAGE_SIZE))

const paginatedJobs = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return openJobs.value.slice(start, start + PAGE_SIZE)
})

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
    <div v-if="loading" class="max-w-5xl mx-auto px-4 py-12">
      <div class="animate-pulse space-y-6">
        <div class="h-52 bg-gray-200 rounded-2xl"></div>
        <div class="h-64 bg-gray-200 rounded-2xl"></div>
      </div>
    </div>

    <!-- Content -->
    <div v-else-if="recruiter" class="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

      <!-- ===== HERO / BLUE HEADER ===== -->
      <div class="bg-linear-to-r from-blue-600 to-blue-800 rounded-2xl shadow-xl p-5 sm:p-8 mb-6 text-white">
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5">

          <!-- Company Logo -->
          <div class="h-20 w-20 sm:h-28 sm:w-28 rounded-xl overflow-hidden shadow-lg bg-white shrink-0">
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

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <h1 class="text-2xl sm:text-3xl font-bold mb-2 truncate">
              {{ recruiter.company_name }}
            </h1>

            <!-- Row 1: Industry + Employee Count -->
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-blue-100 text-sm mb-2">
              <div v-if="recruiter.industry" class="flex items-center gap-1.5">
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{{ recruiter.industry }}</span>
              </div>
              <div v-if="recruiter.employee_count" class="flex items-center gap-1.5">
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{{ recruiter.employee_count }} {{ $t('recruiterPublic.employees') || 'Employees' }}</span>
              </div>
            </div>

            <!-- Row 2: Address -->
            <div v-if="recruiter.address" class="flex items-start gap-1.5 text-blue-100 text-sm mb-2">
              <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span class="line-clamp-2">{{ recruiter.address }}</span>
            </div>

            <!-- Row 3: Social / Website links -->
            <div class="flex flex-wrap items-center gap-3 text-sm mt-1">
              <a
                v-if="recruiter.company_website"
                :href="recruiter.company_website"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-1.5 text-blue-100 hover:text-white transition"
              >
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span class="underline">{{ $t('recruiterPublic.visitWebsite') }}</span>
              </a>
              <a
                v-if="recruiter.instagram_url"
                :href="recruiter.instagram_url"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-1.5 text-blue-100 hover:text-white transition"
              >
                <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.333 3.608 1.308.975.975 1.246 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.333 2.633-1.308 3.608-.975.975-2.242 1.246-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.333-3.608-1.308-.975-.975-1.246-2.242-1.308-3.608C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.062-1.366.333-2.633 1.308-3.608.975-.975 2.242-1.246 3.608-1.308C8.416 2.175 8.796 2.163 12 2.163zm0-2.163c-3.259 0-3.667.014-4.947.072-1.613.074-3.067.372-4.223 1.528C1.674 2.756 1.376 4.21 1.302 5.823.014 7.103 0 7.511 0 12c0 4.489.014 4.897.072 6.177.074 1.613.372 3.067 1.528 4.223 1.156 1.156 2.61 1.454 4.223 1.528C7.103 23.986 7.511 24 12 24c4.489 0 4.897-.014 6.177-.072 1.613-.074 3.067-.372 4.223-1.528 1.156-1.156 1.454-2.61 1.528-4.223.058-1.28.072-1.688.072-6.177 0-4.489-.014-4.897-.072-6.177-.074-1.613-.372-3.067-1.528-4.223C21.267.444 19.813.146 18.2.072 16.92.014 16.512 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
                <span class="underline">Instagram</span>
              </a>
              <a
                v-if="recruiter.tiktok_url"
                :href="recruiter.tiktok_url"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-1.5 text-blue-100 hover:text-white transition"
              >
                <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.19 8.19 0 004.79 1.53V6.77a4.85 4.85 0 01-1.02-.08z"/>
                </svg>
                <span class="underline">TikTok</span>
              </a>
            </div>

            <!-- Open Positions Badge -->
            <div class="flex flex-wrap gap-4 mt-4">
              <div class="bg-white/15 backdrop-blur-sm rounded-lg px-4 py-2 inline-block">
                <div class="text-xl font-bold">{{ openJobs.length }}</div>
                <div class="text-xs text-blue-100">{{ $t('recruiterPublic.openPositions') }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== BODY ===== -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <!-- LEFT: About -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-xl shadow-sm p-5 sm:p-6">
            <h2 class="text-base font-semibold mb-3 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ $t('recruiterPublic.aboutCompany') }}
            </h2>
            <p class="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
              {{ recruiter.description || $t('recruiterPublic.noDescriptionProvided') }}
            </p>
          </div>
        </div>

        <!-- RIGHT: Job Listings -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-xl shadow-sm p-5 sm:p-6">
            <h2 class="text-base font-semibold mb-5 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {{ $t('recruiterPublic.openPositionsCount', { count: openJobs.length }) }}
            </h2>

            <!-- No Jobs -->
            <div v-if="!openJobs.length" class="text-center py-10">
              <svg class="w-14 h-14 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p class="text-gray-500 font-medium">{{ $t('recruiterPublic.noActiveJobs') }}</p>
              <p class="text-sm text-gray-400 mt-1">{{ $t('recruiterPublic.checkBackLater') }}</p>
            </div>

            <!-- Job Cards -->
            <div v-else class="divide-y divide-gray-100">
              <div
                v-for="job in paginatedJobs"
                :key="job.id"
                @click="goToJob(job.id)"
                class="py-4 first:pt-0 last:pb-0 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition cursor-pointer group"
              >
                <!-- Title + Badge -->
                <div class="flex items-start justify-between gap-3 mb-1.5">
                  <h3 class="font-semibold text-gray-900 group-hover:text-blue-600 transition text-sm sm:text-base">
                    {{ job.title }}
                  </h3>
                  <span class="inline-flex shrink-0 items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {{ job.status }}
                  </span>
                </div>

                <!-- Location + Type -->
                <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-2">
                  <div class="flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {{ job.location }}
                  </div>
                  <div class="flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {{ job.employment_type }}
                  </div>
                </div>

                <!-- Description -->
                <p class="text-xs text-gray-500 line-clamp-2 mb-3">{{ job.description }}</p>

                <!-- Salary + Dates -->
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="flex items-center gap-1.5 text-green-600 font-semibold text-xs sm:text-sm">
                    <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ formatSalary(job.salary_min, job.salary_max, job.currency) }}
                  </div>
                  <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                    <span class="flex items-center gap-1">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {{ $t('recruiterPublic.posted') }}: {{ formatDate(job.published_at) }}
                    </span>
                    <span class="flex items-center gap-1">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ $t('recruiterPublic.deadline') }}: {{ formatDate(job.deadline) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pagination -->
            <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-5 pt-4 border-t border-gray-100">
              <button
                @click="currentPage--"
                :disabled="currentPage === 1"
                class="px-3 py-1.5 rounded-md border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {{ $t('previous') }}
              </button>
              <button
                v-for="p in totalPages"
                :key="p"
                @click="currentPage = p"
                :class="[
                  'px-3 py-1.5 rounded-md text-sm border',
                  currentPage === p
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                ]"
              >
                {{ p }}
              </button>
              <button
                @click="currentPage++"
                :disabled="currentPage === totalPages"
                class="px-3 py-1.5 rounded-md border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {{ $t('next') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="max-w-5xl mx-auto px-4 py-12 text-center">
      <p class="text-gray-500">{{ $t('recruiterPublic.failedToLoad') }}</p>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

