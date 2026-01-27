<template>
    <div class="min-h-screen bg-gray-50">
    <HeroSearch @search="handleSearchFromHero" />

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 py-6">
      <div class="flex gap-6">
        <!-- Sidebar - Categories & Filters -->
        <aside class="hidden lg:block w-64 shrink-0">
          <div class="bg-white rounded-lg shadow p-4 sticky top-6">
            <h3 class="font-semibold text-lg mb-4 text-gray-900">Categories</h3>
            <ul class="space-y-2">
              <!-- All -->
              <li>
                <button
                  @click="resetCategory"
                  :class="[
                    'w-full text-left px-3 py-2 rounded hover:bg-gray-100 flex items-center justify-between',
                    selectedCategory === '' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  ]"
                >
                  <span>All Categories</span>
                </button>
              </li>

              <!-- Categories -->
              <li v-for="category in visibleCategories" :key="category.id">
                <button
                  @click="selectedCategory = category.name; handleFilterChange()"
                  :class="[
                    'w-full text-left px-3 py-2 rounded hover:bg-gray-100 flex items-center justify-between',
                    selectedCategory === category.name
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700'
                  ]"
                >
                  <span>{{ category.name }}</span>
                  <span class="text-sm text-gray-500">{{ category.job_count }}</span>
                </button>
              </li>

              <div
                v-if="categories.length > CATEGORY_LIMIT"
                class="mt-4 pt-3 border-t border-gray-100"
              >
                <button
                  @click="showAllCategories = !showAllCategories"
                  class="
                    w-full
                    flex items-center justify-center gap-2
                    px-3 py-2
                    rounded-md
                    text-sm font-medium
                    text-gray-600
                    hover:text-blue-600
                    hover:bg-blue-50
                    transition
                    cursor-pointer
                    focus:outline-none
                  "
                >
                  <span>
                    {{ showAllCategories ? 'View less categories' : 'View more categories' }}
                  </span>

                  <svg
                    class="w-4 h-4 transition-transform duration-200"
                    :class="{ 'rotate-180': showAllCategories }"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
            </ul>


            <div class="mt-6 pt-6 border-t">
              <h4 class="font-semibold text-sm mb-3 text-gray-900">
                Employment Types
              </h4>

              <div class="space-y-2">
                <label
                  v-for="type in employmentTypes"
                  :key="type.id"
                  class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    v-model="selectedEmploymentTypes"
                    @change="handleFilterChange"
                    :value="type.name"
                    class="rounded"
                  />
                  <span>{{ type.name }}</span>
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
                Found {{ totalData }} Job Vacancies
              </h2>
              <select v-model="sortBy" @change="handleFilterChange" class="px-4 py-2 border border-gray-300 rounded text-sm text-gray-700">
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
                <option value="highest-salary">Highest Salary</option>
                <!-- <option value="relevant">Paling Relevan</option> -->
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
                    :src="'http://localhost:5000'+job.avatar_url || '/company-default-image.png'"
                    @error="e => e.target.src = '/company-default-image.png'"
                    :alt="job.company_name"
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
                      <span>{{ job.company_name }}</span>
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
                      <span>{{ formatNumber(job.salary_min) }} {{ job.currency }}</span> - <span>{{ formatNumber(job.salary_max) }} {{ job.currency }}</span>
                    </div>
                    <div class="flex items-center gap-1 text-gray-500">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>{{ job.employment_type }}</span>
                    </div>
                    <div class="flex items-center gap-1 text-gray-500">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{{ timeAgo(job.created_at) }}</span>
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
              Previous
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
              Next
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
import { getJobPosts } from '../services/jobposts.api';
import { getCategoriesWithJobcount } from '../services/categories.api';
import { useRoute, useRouter } from 'vue-router'
import { getEmploymentTypes } from '../services/employment_types.api';

const route = useRoute();
const router = useRouter();


// State
    const jobs = ref([]);
    const categories = ref([]);
    const loading = ref(true);
    const searchQuery = ref('');
    const selectedCategory = ref('');
    const showFilters = ref(false);
    const sortBy = ref('created_at');
    const currentPage = ref(1);
    const totalPages = ref(5);
    const totalData = ref(0);
    const CATEGORY_LIMIT = 6;
    const showAllCategories = ref(false);
    const employmentTypes = ref([]);
    const selectedEmploymentTypes = ref([]);


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
    const visibleCategories = computed(() => {
      return showAllCategories.value
        ? categories.value
        : categories.value.slice(0, CATEGORY_LIMIT)
    });

    const formatNumber = (num) =>
        new Intl.NumberFormat('en-US').format(num);
    
    function timeAgo(dateString) {
        const date = new Date(dateString)
        const now = new Date()

        const seconds = Math.floor((now - date) / 1000)

        const units = [
        { name: 'year',   seconds: 31536000 },
        { name: 'month',  seconds: 2592000 },
        { name: 'day',    seconds: 86400 },
        { name: 'hour',   seconds: 3600 },
        { name: 'minute', seconds: 60 },
        ]

        for (const unit of units) {
            const value = Math.floor(seconds / unit.seconds)
            if (value >= 1) {
                return `posted ${new Intl.RelativeTimeFormat('en', { numeric: 'always' })
                .format(-value, unit.name)}`
            }
        }

        return 'posted just now'
    }

    // API Service menggunakan Axios
    const jobService = {
      async fetchJobs(filters = {}) {
        try {
          const params = {
            // search: filters.search,
            // location: filters.location,
            // category: filters.category,
            // jobTypes: filters.jobTypes,
            // sortBy: filters.sortBy,
            page: filters.page,
            limit: filters.limit
          }

          if (filters.search && filters.search.trim() !== '') {
            params.search = filters.search.trim()
          }
          
          if (filters.category !== '') {
            params.category = filters.category;
          }

          if (filters.employmentTypes?.length) {
            params.employment_type = filters.employmentTypes.join(',');
          }

          if (filters.sortBy !== '') {
            if (filters.sortBy === 'latest') {
              params.sort_by = 'created_at';
              params.sort_order = 'desc';
            } else if(filters.sortBy === 'oldest') {
              params.sort_by = 'created_at';
              params.sort_order = 'asc';
            } else if(filters.sortBy === "highest-salary") {
              params.sort_by = 'salary_max';
              params.sort_order = 'desc';
            } else {
              params.sort_by = 'created_at';
              params.sort_order = 'desc';       
            }
          }

          const response = await getJobPosts(params);
          return response.data;

        } catch (error) {
          console.error('Error fetching jobs:', error);
          throw error;
        }
      },

      async fetchCategories() {
        try {
          const response = await getCategoriesWithJobcount();
          return response.data;
        } catch (error) {
          console.error('Error fetching categories:', error);
          throw error;
        }
      },

      async fetchEmploymentTypes() {
        try {
          const response = await getEmploymentTypes();
          return response.data;
        } catch (error) {
          console.error('Error fetching employment types:', error);
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
          // location: locationFilter.value,
          category: selectedCategory.value,
          employmentTypes: selectedEmploymentTypes.value,
          sortBy: sortBy.value,
          page: currentPage.value,
          limit: 3
        });
        jobs.value = data.data;
        totalPages.value = data.meta.totalPage;
        totalData.value = data.meta.total;
        

      } catch (error) {
        console.error('Error loading jobs:', error);
      } finally {
        loading.value = false;
      }
    };

    const loadCategories = async () => {
      try {
        const data = await jobService.fetchCategories();
        categories.value = data.data;
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    const loadEmploymentTypes = async () => {
      try {
        const data = await jobService.fetchEmploymentTypes();
        employmentTypes.value = data.data;
      } catch (err) {
        console.error('Error loading employment types:', err)
      }
    }

    const handleSearchFromHero = (value) => {
      const keyword = value?.trim();
      
      // Buat copy query yang ada sekarang
      const newQuery = { ...route.query };

      if (!keyword) {
        // Jika kosong, hapus property search dari object query
        searchQuery.value = '';
        delete newQuery.search;
      } else {
        // Jika ada isinya, update property search
        searchQuery.value = keyword;
        newQuery.search = keyword;
      }

      // Setiap kali search berubah, kita harus reset ke halaman 1
      newQuery.page = 1;

      // Eksekusi navigasi
      router.push({ query: newQuery });
    };

    const viewJobDetail = (jobId) => {
      console.log('View job detail:', jobId);
      // Implementasi navigasi ke detail page
      // this.$router.push(`/jobs/${jobId}`);
    };

    const prevPage = () => {
      if (currentPage.value > 1) {
        goToPage(currentPage.value - 1);
      }
    };

    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        goToPage(currentPage.value + 1);
      }
    };

    const goToPage = (page) => {
      // Cukup ubah URL, biarkan watcher route.query yang memanggil API
      router.push({
        query: {
          ...route.query,
          page: page
        }
      });
    }

    const handleFilterChange = () => {
      router.push({
        query: {
          ...route.query,
          sort_by: sortBy.value,
          category: selectedCategory.value || undefined,
          employment_types: selectedEmploymentTypes.value.length
            ? selectedEmploymentTypes.value.join(',')
            : undefined,
          page: 1 // Reset ke 1 hanya saat fungsi ini dipanggil
        }
      });
    };

    const resetCategory = () => {
      selectedCategory.value = ''; // Reset state internal
      
      // Buat copy dari query saat ini
      const query = { ...route.query };
      
      // Hapus key category dari object query
      delete query.category;
      
      // Reset ke halaman 1 saat ganti kategori
      query.page = 1;

      // Navigasi dengan query yang sudah bersih
      router.push({ query });
    };


    // Watchers

    watch(
      () => route.query,
      (q) => {
        searchQuery.value = q.search || '';
        selectedCategory.value = q.category || '';
        sortBy.value = q.sort_by || 'created_at';
        selectedEmploymentTypes.value = q.employment_types
          ? q.employment_types.split(',')
          : [];
        currentPage.value = Number(q.page || 1);

        loadJobs();
      },
      { immediate: true }
    )

    // Lifecycle
    onMounted(() => {
      loadCategories();
      loadEmploymentTypes();
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