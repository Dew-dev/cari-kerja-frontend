<template>
    <div class="min-h-screen bg-gray-50">
    <HeroSearch />

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 py-6">
      <div class="flex gap-6">
        <!-- Sidebar - Categories & Filters -->
        <aside class="hidden lg:block w-64 shrink-0">
          <div class="bg-white rounded-lg shadow p-4 sticky top-6">
            <h3 class="font-semibold text-lg mb-4 text-gray-900">Kategori</h3>
            <ul class="space-y-2">
              <li>
                <button
                  @click="selectedCategory = ''"
                  :class="[
                    'w-full text-left px-3 py-2 rounded hover:bg-gray-100 flex items-center justify-between',
                    selectedCategory === '' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  ]"
                >
                  <span>Semua Kategori</span>
                </button>
              </li>
              <li v-for="category in categories" :key="category.id">
                <button
                  @click="selectedCategory = category.id"
                  :class="[
                    'w-full text-left px-3 py-2 rounded hover:bg-gray-100 flex items-center justify-between',
                    selectedCategory === category.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  ]"
                >
                  <span>{{ category.name }}</span>
                  <span class="text-sm text-gray-500">{{ category.count }}</span>
                </button>
              </li>
            </ul>

            <div class="mt-6 pt-6 border-t">
              <h4 class="font-semibold text-sm mb-3 text-gray-900">Tipe Pekerjaan</h4>
              <div class="space-y-2">
                <label class="flex items-center gap-2 text-sm text-gray-700">
                  <input v-model="jobTypes" type="checkbox" value="fulltime" class="rounded" />
                  <span>Full-time</span>
                </label>
                <label class="flex items-center gap-2 text-sm text-gray-700">
                  <input v-model="jobTypes" type="checkbox" value="parttime" class="rounded" />
                  <span>Part-time</span>
                </label>
                <label class="flex items-center gap-2 text-sm text-gray-700">
                  <input v-model="jobTypes" type="checkbox" value="remote" class="rounded" />
                  <span>Remote</span>
                </label>
                <label class="flex items-center gap-2 text-sm text-gray-700">
                  <input v-model="jobTypes" type="checkbox" value="freelance" class="rounded" />
                  <span>Freelance</span>
                </label>
              </div>
            </div>
          </div>
        </aside>

        <!-- Job Listings -->
        <main class="flex-1">
          <!-- Mobile Filter Button -->
          <div class="lg:hidden mb-4">
            <button
              @click="showFilters = !showFilters"
              class="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow text-gray-700"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Filter</span>
            </button>
          </div>

          <!-- Results Header -->
          <div class="bg-white rounded-lg shadow p-4 mb-4">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-900">
                Ditemukan {{ jobs.length }} lowongan pekerjaan
              </h2>
              <select v-model="sortBy" class="px-4 py-2 border border-gray-300 rounded text-sm text-gray-700">
                <option value="latest">Terbaru</option>
                <option value="salary">Gaji Tertinggi</option>
                <option value="relevant">Paling Relevan</option>
              </select>
            </div>
          </div>

          <!-- Job Cards -->
          <div class="space-y-4">
            <!-- Loading State -->
            <div v-if="loading" class="bg-white rounded-lg shadow p-8 text-center">
              <div class="animate-pulse">
                <div class="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
                <div class="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            </div>

            <!-- Job List -->
            <div
              v-else
              v-for="job in jobs"
              :key="job.id"
              class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-5 cursor-pointer"
              @click="viewJobDetail(job.id)"
            >
              <div class="flex gap-4">
                <div class="shrink-0">
                  <img
                    :src="job.logo"
                    :alt="job.company"
                    class="w-16 h-16 rounded border border-gray-200"
                  />
                </div>
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-gray-900 mb-1 hover:text-blue-600">
                    {{ job.title }}
                  </h3>
                  <div class="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <div class="flex items-center gap-1">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span>{{ job.company }}</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{{ job.location }}</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-4 text-sm mb-3">
                    <div class="flex items-center gap-1 text-green-600 font-semibold">
                      <span>{{ job.salary }}</span>
                    </div>
                    <div class="flex items-center gap-1 text-gray-500">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>{{ job.type }}</span>
                    </div>
                    <div class="flex items-center gap-1 text-gray-500">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{{ job.postedDate }}</span>
                    </div>
                  </div>
                  <p class="text-sm text-gray-600 line-clamp-2">
                    {{ job.description }}
                  </p>
                </div>
                <div class="flex items-center">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div class="mt-6 flex justify-center gap-2">
            <button
              @click="prevPage"
              :disabled="currentPage === 1"
              class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sebelumnya
            </button>
            <button
              v-for="page in displayPages"
              :key="page"
              @click="goToPage(page)"
              :class="[
                'px-4 py-2 rounded',
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
              ]"
            >
              {{ page }}
            </button>
            <button
              @click="nextPage"
              :disabled="currentPage === totalPages"
              class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Selanjutnya
            </button>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import HeroSearch from "../components/home/HeroSearch.vue";
import axios from 'axios';
import { getJobPosts } from '../services/jobposts.api';

// State
    const jobs = ref([]);
    const categories = ref([]);
    const loading = ref(true);
    const searchQuery = ref('');
    const locationFilter = ref('');
    const selectedCategory = ref('');
    const jobTypes = ref([]);
    const showFilters = ref(false);
    const sortBy = ref('latest');
    const currentPage = ref(1);
    const totalPages = ref(5);

    // Computed
    const displayPages = computed(() => {
      const pages = [];
      const start = Math.max(1, currentPage.value - 1);
      const end = Math.min(totalPages.value, currentPage.value + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      return pages;
    });

    // API Service menggunakan Axios
    const jobService = {
      async fetchJobs(filters = {}) {
        try {
          // PLACEHOLDER - Ganti dengan endpoint backend Anda
          // const response = await axios.get('http://your-api.com/api/jobs', {
          //   params: {
          //     search: filters.search,
          //     location: filters.location,
          //     category: filters.category,
          //     jobTypes: filters.jobTypes,
          //     sortBy: filters.sortBy,
          //     page: filters.page,
          //     perPage: filters.perPage
          //   }
          // });
          // return response.data;
          const res = getJobPosts(filters);
          console.log(res);
          

          // Simulasi data untuk demo
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                jobs: [
                  {
                    id: 1,
                    title: 'Senior Frontend Developer',
                    company: 'Tech Solutions Inc.',
                    location: 'Jakarta',
                    salary: 'Rp 15.000.000 - 25.000.000',
                    type: 'Full-time',
                    postedDate: '2 hari yang lalu',
                    description: 'We are looking for an experienced Frontend Developer with strong skills in Vue.js and modern web technologies...',
                    logo: 'https://via.placeholder.com/60'
                  },
                  {
                    id: 2,
                    title: 'Backend Developer (Node.js)',
                    company: 'Digital Innovations',
                    location: 'Bandung',
                    salary: 'Rp 12.000.000 - 20.000.000',
                    type: 'Full-time',
                    postedDate: '1 hari yang lalu',
                    description: 'Join our team as a Backend Developer. We need someone with expertise in Node.js, Express, and MongoDB...',
                    logo: 'https://via.placeholder.com/60'
                  },
                  {
                    id: 3,
                    title: 'UI/UX Designer',
                    company: 'Creative Studio',
                    location: 'Surabaya',
                    salary: 'Rp 10.000.000 - 18.000.000',
                    type: 'Full-time',
                    postedDate: '3 hari yang lalu',
                    description: 'We need a talented UI/UX Designer who can create beautiful and user-friendly interfaces...',
                    logo: 'https://via.placeholder.com/60'
                  },
                  {
                    id: 4,
                    title: 'DevOps Engineer',
                    company: 'Cloud Systems',
                    location: 'Jakarta',
                    salary: 'Rp 18.000.000 - 30.000.000',
                    type: 'Full-time',
                    postedDate: '4 hari yang lalu',
                    description: 'Looking for DevOps Engineer with AWS experience, Docker, Kubernetes, and CI/CD pipeline expertise...',
                    logo: 'https://via.placeholder.com/60'
                  },
                  {
                    id: 5,
                    title: 'Mobile Developer (Flutter)',
                    company: 'App Ventures',
                    location: 'Yogyakarta',
                    salary: 'Rp 11.000.000 - 19.000.000',
                    type: 'Full-time',
                    postedDate: '5 hari yang lalu',
                    description: 'Seeking Mobile Developer for our products. Experience with Flutter and Dart is required...',
                    logo: 'https://via.placeholder.com/60'
                  },
                  {
                    id: 6,
                    title: 'Data Scientist',
                    company: 'Analytics Pro',
                    location: 'Jakarta',
                    salary: 'Rp 16.000.000 - 28.000.000',
                    type: 'Full-time',
                    postedDate: '1 minggu yang lalu',
                    description: 'Join our data science team. Strong background in Python, machine learning, and data analysis required...',
                    logo: 'https://via.placeholder.com/60'
                  }
                ],
                total: 150,
                page: filters.page || 1,
                perPage: 20,
                totalPages: 5
              });
            }, 500);
          });
        } catch (error) {
          console.error('Error fetching jobs:', error);
          throw error;
        }
      },

      async fetchCategories() {
        try {
          // PLACEHOLDER - Ganti dengan endpoint backend Anda
          // const response = await axios.get('http://your-api.com/api/categories');
          // return response.data;

          // Simulasi data untuk demo
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve([
                { id: 1, name: 'IT / Software', count: 45 },
                { id: 2, name: 'Marketing', count: 28 },
                { id: 3, name: 'Design', count: 22 },
                { id: 4, name: 'Finance', count: 18 },
                { id: 5, name: 'Sales', count: 35 }
              ]);
            }, 300);
          });
        } catch (error) {
          console.error('Error fetching categories:', error);
          throw error;
        }
      }
    };

    // Methods
    const loadJobs = async () => {
      try {
        loading.value = true;
        const data = await jobService.fetchJobs({
          search: searchQuery.value,
          location: locationFilter.value,
          category: selectedCategory.value,
          jobTypes: jobTypes.value,
          sortBy: sortBy.value,
          page: currentPage.value,
          perPage: 20
        });
        jobs.value = data.jobs;
        totalPages.value = data.totalPages;
      } catch (error) {
        console.error('Error loading jobs:', error);
      } finally {
        loading.value = false;
      }
    };

    const loadCategories = async () => {
      try {
        const data = await jobService.fetchCategories();
        categories.value = data;
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    const handleSearch = () => {
      currentPage.value = 1;
      loadJobs();
    };

    const viewJobDetail = (jobId) => {
      console.log('View job detail:', jobId);
      // Implementasi navigasi ke detail page
      // this.$router.push(`/jobs/${jobId}`);
    };

    const prevPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--;
        loadJobs();
      }
    };

    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++;
        loadJobs();
      }
    };

    const goToPage = (page) => {
      currentPage.value = page;
      loadJobs();
    };

    // Watchers
    watch([selectedCategory, jobTypes, sortBy], () => {
      currentPage.value = 1;
      loadJobs();
    });

    // Lifecycle
    onMounted(() => {
      loadJobs();
      loadCategories();
    });

</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2; 
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>