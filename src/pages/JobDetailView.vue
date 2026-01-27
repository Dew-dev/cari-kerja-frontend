<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Loading State -->
    <div v-if="loading" class="max-w-5xl mx-auto px-4 py-8">
      <div class="bg-white rounded-lg shadow p-8">
        <div class="animate-pulse space-y-4">
          <div class="h-8 bg-gray-200 rounded w-3/4"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          <div class="h-4 bg-gray-200 rounded w-full"></div>
          <div class="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    </div>

    <!-- Job Detail Content -->
    <div v-else-if="job" class="max-w-5xl mx-auto px-4 py-8">
      <!-- Breadcrumb -->
      <nav class="mb-6">
        <ol class="flex items-center gap-2 text-sm text-gray-600">
          <li>
            <router-link to="/" class="hover:text-blue-600">Home</router-link>
          </li>
          <li>/</li>
          <li>
            <router-link to="/jobs" class="hover:text-blue-600">Jobs</router-link>
          </li>
          <li>/</li>
          <li class="text-gray-900 font-medium">{{ job.title }}</li>
        </ol>
      </nav>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column - Job Details -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Job Header Card -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex gap-4 mb-6">
              <div class="shrink-0">
                <img
                  :src="job.company.avatar_url"
                  :alt="job.company.name"
                  class="w-20 h-20 rounded-lg border border-gray-200 object-cover"
                />
              </div>
              <div class="flex-1">
                <h1 class="text-2xl font-bold text-gray-900 mb-2">
                  {{ job.title }}
                </h1>
                <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span class="font-medium">{{ job.company.name }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{{ job.location }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{{ timeAgo(job.created_at) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Job Key Info -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div class="border border-gray-200 rounded-lg p-4">
                <div class="text-xs text-gray-500 mb-1">Salary</div>
                <div class="text-lg font-semibold text-green-600">
                  {{ formatNumber(job.salary_min) }} - {{ formatNumber(job.salary_max) }} {{ job.currency }}
                </div>
              </div>
              <div class="border border-gray-200 rounded-lg p-4">
                <div class="text-xs text-gray-500 mb-1">Employment Type</div>
                <div class="text-lg font-semibold text-gray-900">
                  {{ job.employment_type }}
                </div>
              </div>
              <div class="border border-gray-200 rounded-lg p-4">
                <div class="text-xs text-gray-500 mb-1">Category</div>
                <div class="text-lg font-semibold text-gray-900">
                  {{ job.category }}
                </div>
              </div>
            </div>

            <!-- Apply Button -->
            <button
              @click="handleApply"
              :disabled="isApplying || hasApplied"
              class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
            >
              <svg v-if="hasApplied" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{{ hasApplied ? 'Already Applied' : isApplying ? 'Applying...' : 'Apply Now' }}</span>
            </button>
          </div>

          <!-- Job Description -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4">Job Description</h2>
            <div class="prose max-w-none text-gray-700 whitespace-pre-line">
              {{ job.description }}
            </div>
          </div>

          <!-- Requirements -->
          <div v-if="job.requirements" class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4">Requirements</h2>
            <div class="prose max-w-none text-gray-700 whitespace-pre-line">
              {{ job.requirements }}
            </div>
          </div>

          <!-- Responsibilities -->
          <div v-if="job.responsibilities" class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4">Responsibilities</h2>
            <div class="prose max-w-none text-gray-700 whitespace-pre-line">
              {{ job.responsibilities }}
            </div>
          </div>

          <!-- Benefits -->
          <div v-if="job.benefits" class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4">Benefits</h2>
            <div class="prose max-w-none text-gray-700 whitespace-pre-line">
              {{ job.benefits }}
            </div>
          </div>
        </div>

        <!-- Right Column - Company Info & Similar Jobs -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Company Info Card -->
          <div class="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">About Company</h3>
            <div class="flex items-center gap-3 mb-4">
              <img
                :src="job.company.avatar_url"
                :alt="job.company.name"
                class="w-16 h-16 rounded-lg border border-gray-200 object-cover"
              />
              <div>
                <h4 class="font-semibold text-gray-900">{{ job.company.name }}</h4>
                <p class="text-sm text-gray-600">{{ job.company.industry || 'Technology' }}</p>
              </div>
            </div>

            <div class="space-y-3 text-sm">
              <div v-if="job.company.website" class="flex items-start gap-2">
                <svg class="w-4 h-4 mt-0.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <a :href="job.company.website" target="_blank" class="text-blue-600 hover:underline break-all">
                  {{ job.company.website }}
                </a>
              </div>

              <div v-if="job.company.email" class="flex items-start gap-2">
                <svg class="w-4 h-4 mt-0.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span class="text-gray-600 break-all">{{ job.company.email }}</span>
              </div>

              <div v-if="job.company.description" class="mt-4 pt-4 border-t">
                <p class="text-gray-600 text-sm">{{ job.company.description }}</p>
              </div>
            </div>

            <button
              @click="viewCompanyProfile"
              class="mt-4 w-full border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-2 px-4 rounded-lg transition duration-200"
            >
              View Company Profile
            </button>
          </div>

          <!-- Similar Jobs -->
          <div v-if="similarJobs.length > 0" class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">Similar Jobs</h3>
            <div class="space-y-4">
              <div
                v-for="similarJob in similarJobs"
                :key="similarJob.id"
                @click="goToJob(similarJob.id)"
                class="border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md cursor-pointer transition"
              >
                <h4 class="font-semibold text-gray-900 mb-1 hover:text-blue-600">
                  {{ similarJob.title }}
                </h4>
                <p class="text-sm text-gray-600 mb-2">{{ similarJob.company_name }}</p>
                <div class="flex items-center justify-between text-xs text-gray-500">
                  <span>{{ similarJob.location }}</span>
                  <span class="text-green-600 font-semibold">
                    {{ formatNumber(similarJob.salary_max) }} {{ similarJob.currency }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="max-w-5xl mx-auto px-4 py-16 text-center">
      <div class="bg-white rounded-lg shadow p-8">
        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Job Not Found</h3>
        <p class="text-gray-600 mb-6">The job you're looking for doesn't exist or has been removed.</p>
        <router-link
          to="/jobs"
          class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-200"
        >
          Back to Job Listings
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

// State
const props = defineProps(['id']);
const job = ref(null);
const similarJobs = ref([]);
const loading = ref(true);
const isApplying = ref(false);
const hasApplied = ref(false);

// Computed
const jobId = computed(() => route.params.id);

// Helper Functions
const formatNumber = (num) => new Intl.NumberFormat('en-US').format(num);

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  const units = [
    { name: 'year', seconds: 31536000 },
    { name: 'month', seconds: 2592000 },
    { name: 'day', seconds: 86400 },
    { name: 'hour', seconds: 3600 },
    { name: 'minute', seconds: 60 },
  ];

  for (const unit of units) {
    const value = Math.floor(seconds / unit.seconds);
    if (value >= 1) {
      return `Posted ${new Intl.RelativeTimeFormat('en', { numeric: 'always' }).format(-value, unit.name)}`;
    }
  }

  return 'Posted just now';
}

// API Service
const jobDetailService = {
  async fetchJobDetail(id) {
    try {
      // PLACEHOLDER - Ganti dengan endpoint backend Anda
      // const response = await axios.get(`http://your-api.com/api/jobs/${id}`);
      // return response.data;

      // Simulasi data untuk demo
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: {
              id: id,
              title: 'Senior Frontend Developer',
              company: {
                name: 'Tech Solutions Inc.',
                avatar_url: 'https://via.placeholder.com/80',
                industry: 'Information Technology',
                website: 'https://techsolutions.com',
                email: 'hr@techsolutions.com',
                description: 'Leading technology solutions provider with over 10 years of experience in delivering innovative software products.'
              },
              location: 'Jakarta, Indonesia',
              salary_min: 15000000,
              salary_max: 25000000,
              currency: 'IDR',
              employment_type: 'Full-time',
              category: 'IT / Software',
              created_at: '2025-01-20T10:00:00Z',
              description: `We are looking for an experienced Senior Frontend Developer to join our dynamic team. 

In this role, you will be responsible for building modern, responsive web applications using Vue.js and other cutting-edge technologies.

The ideal candidate should have strong problem-solving skills and a passion for creating exceptional user experiences.`,
              requirements: `• 5+ years of experience in frontend development
• Expert knowledge of Vue.js, JavaScript/TypeScript
• Strong understanding of HTML5, CSS3, and responsive design
• Experience with state management (Vuex/Pinia)
• Familiarity with RESTful APIs and GraphQL
• Experience with version control (Git)
• Strong communication skills in English
• Bachelor's degree in Computer Science or related field`,
              responsibilities: `• Develop and maintain web applications using Vue.js
• Collaborate with designers and backend developers
• Write clean, maintainable, and testable code
• Participate in code reviews and provide constructive feedback
• Optimize application performance and ensure cross-browser compatibility
• Mentor junior developers and share best practices
• Stay up-to-date with latest frontend technologies and trends`,
              benefits: `• Competitive salary package
• Health insurance coverage
• Flexible working hours
• Remote work options
• Annual performance bonus
• Professional development opportunities
• Modern office facilities
• Team building activities`,
              is_applied: false
            }
          });
        }, 800);
      });
    } catch (error) {
      console.error('Error fetching job detail:', error);
      throw error;
    }
  },

  async fetchSimilarJobs(jobId, category) {
    try {
      // PLACEHOLDER - Ganti dengan endpoint backend Anda
      // const response = await axios.get(`http://your-api.com/api/jobs/${jobId}/similar`, {
      //   params: { category }
      // });
      // return response.data;

      // Simulasi data untuk demo
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: [
              {
                id: 2,
                title: 'Frontend Developer (Vue.js)',
                company_name: 'Digital Agency',
                location: 'Bandung',
                salary_max: 20000000,
                currency: 'IDR'
              },
              {
                id: 3,
                title: 'Full Stack Developer',
                company_name: 'Startup Tech',
                location: 'Jakarta',
                salary_max: 22000000,
                currency: 'IDR'
              },
              {
                id: 4,
                title: 'React Developer',
                company_name: 'Web Solutions',
                location: 'Surabaya',
                salary_max: 18000000,
                currency: 'IDR'
              }
            ]
          });
        }, 600);
      });
    } catch (error) {
      console.error('Error fetching similar jobs:', error);
      throw error;
    }
  },

  async applyToJob(jobId) {
    try {
      // PLACEHOLDER - Ganti dengan endpoint backend Anda
      // const response = await axios.post(`http://your-api.com/api/jobs/${jobId}/apply`, {
      //   // Include any application data if needed
      // });
      // return response.data;

      // Simulasi untuk demo
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'Application submitted successfully'
          });
        }, 1000);
      });
    } catch (error) {
      console.error('Error applying to job:', error);
      throw error;
    }
  },

  async checkApplicationStatus(jobId) {
    try {
      // PLACEHOLDER - Ganti dengan endpoint backend Anda
      // const response = await axios.get(`http://your-api.com/api/jobs/${jobId}/application-status`);
      // return response.data;

      // Simulasi untuk demo
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            has_applied: false
          });
        }, 500);
      });
    } catch (error) {
      console.error('Error checking application status:', error);
      throw error;
    }
  }
};

// Auth Helper Functions
const authService = {
  isAuthenticated() {
    // PLACEHOLDER - Ganti dengan logika autentikasi Anda
    // Contoh: Cek token di localStorage
    // return !!localStorage.getItem('auth_token');
    
    // Untuk demo, return false (belum login)
    return false;
  },

  getUserRole() {
    // PLACEHOLDER - Ganti dengan logika untuk mendapatkan role user
    // Contoh: Parse JWT token atau ambil dari store/localStorage
    // const user = JSON.parse(localStorage.getItem('user'));
    // return user?.role; // 'worker' atau 'recruiter'
    
    // Untuk demo
    return 'worker'; // atau 'recruiter'
  },

  isWorker() {
    return this.getUserRole() === 'worker';
  },

  isRecruiter() {
    return this.getUserRole() === 'recruiter';
  }
};

// Methods
const loadJobDetail = async () => {
  try {
    loading.value = true;
    const response = await jobDetailService.fetchJobDetail(jobId.value);
    job.value = response.data;
    
    // Check if user has already applied
    if (authService.isAuthenticated() && authService.isWorker()) {
      const statusResponse = await jobDetailService.checkApplicationStatus(jobId.value);
      hasApplied.value = statusResponse.has_applied || job.value.is_applied;
    }

    // Load similar jobs
    await loadSimilarJobs();
  } catch (error) {
    console.error('Error loading job detail:', error);
    job.value = null;
  } finally {
    loading.value = false;
  }
};

const loadSimilarJobs = async () => {
  try {
    if (!job.value) return;
    const response = await jobDetailService.fetchSimilarJobs(jobId.value, job.value.category);
    similarJobs.value = response.data;
  } catch (error) {
    console.error('Error loading similar jobs:', error);
  }
};

const handleApply = async () => {
  // Check if user is authenticated
  if (!authService.isAuthenticated()) {
    // Redirect to login page with return URL
    router.push({
      path: '/login',
      query: { redirect: route.fullPath }
    });
    return;
  }

  // Check if user is recruiter
  if (authService.isRecruiter()) {
    alert('Recruiters cannot apply to jobs. This feature is only for workers.');
    return;
  }

  // Check if already applied
  if (hasApplied.value) {
    return;
  }

  try {
    isApplying.value = true;
    await jobDetailService.applyToJob(jobId.value);
    hasApplied.value = true;
    
    // Show success message
    alert('Application submitted successfully! The recruiter will review your application soon.');
  } catch (error) {
    console.error('Error applying to job:', error);
    alert('Failed to submit application. Please try again.');
  } finally {
    isApplying.value = false;
  }
};

const viewCompanyProfile = () => {
  // Navigate to company profile page
  // router.push(`/companies/${job.value.company.id}`);
  console.log('Navigate to company profile');
};

const goToJob = (id) => {
  router.push(`/jobs/${id}`);
};

// Lifecycle
onMounted(() => {
  loadJobDetail();
});
</script>

<style scoped>
.prose {
  line-height: 1.6;
}

.prose p {
  margin-bottom: 1rem;
}
</style>