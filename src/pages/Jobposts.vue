<template>
  <div class="min-h-screen bg-gray-50">
    <HeroSearch v-model="searchQuery" @search="handleSearch" />

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex flex-col lg:flex-row gap-6">
        <!-- Sidebar - Categories & Filters -->
        <aside :class="['shrink-0 w-full lg:w-64', showFilters ? 'block' : 'hidden lg:block']">
          <div class="bg-white rounded-lg shadow p-4 sticky top-6">
            <h3 class="font-semibold text-lg mb-4 text-gray-900">
              {{ $t("categories") }}
            </h3>
            <ul class="space-y-2">
              <!-- Recommended For You (Only if logged in) -->
              <li v-if="canUseRecommendations">
                <button
                  @click="enableRecommendations()"
                  :class="[
                    'w-full text-left px-3 py-2 rounded hover:bg-gray-100 flex items-center justify-between',
                    selectedCategory === '' && recommendations
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700',
                  ]"
                >
                  <span>{{ $t("recommendedForYou") }}</span>
                </button>
              </li>
              <!-- All Categories -->
              <li>
                <button
                  @click="disableRecommendations()"
                  :class="[
                    'w-full text-left px-3 py-2 rounded hover:bg-gray-100 flex items-center justify-between',
                    selectedCategory === '' && !recommendations
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700',
                  ]"
                >
                  <span>{{ $t("allCategories") }}</span>
                </button>
              </li>

              <!-- Categories -->
              <li v-for="category in visibleCategories" :key="category.id">
                <button
                  @click="
                    selectedCategory = category.name;
                    handleFilterChange();
                  "
                  :class="[
                    'w-full text-left px-3 py-2 rounded hover:bg-gray-100 flex items-center justify-between',
                    selectedCategory === category.name
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700',
                  ]"
                >
                  <span class="truncate">{{ category.name }}</span>
                  <span class="text-sm text-gray-500">{{
                    category.job_count
                  }}</span>
                </button>
              </li>

              <div
                v-if="categories.length > CATEGORY_LIMIT"
                class="mt-4 pt-3 border-t border-gray-100"
              >
                <button
                  @click="showAllCategories = !showAllCategories"
                  class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer focus:outline-none"
                >
                  <span>
                    {{
                      showAllCategories
                        ? $t("viewLessCategories")
                        : $t("viewMoreCategories")
                    }}
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
<!-- 
            <div class="mt-6 pt-6 border-t">
              <h4 class="font-semibold text-sm mb-3 text-gray-900">
                {{ $t("location") }}
              </h4>

              <div class="space-y-2">
                <div class="relative">
                  <input
                    v-model="provinceInput"
                    @focus="handleProvinceFocus"
                    @click="handleProvinceFocus"
                    class="w-full border border-gray-200 shadow-sm rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    :placeholder="$t('province')"
                  />
                  <div
                    v-if="provinceOptions.length"
                    class="absolute z-10 bg-white shadow-lg w-full mt-1 max-h-48 overflow-y-auto"
                  >
                    <div
                      v-for="province in provinceOptions"
                      :key="province.id"
                      @click="selectProvince(province)"
                      class="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
                    >
                      {{ province.name }}
                    </div>
                  </div>
                  <p v-if="provinceLoading" class="text-xs text-gray-500 mt-1">
                    Loading provinces...
                  </p>
                </div>

                <div class="relative">
                  <input
                    v-model="cityInput"
                    :disabled="!selectedProvinceId"
                    @focus="handleCityFocus"
                    @click="handleCityFocus"
                    class="w-full border border-gray-200 shadow-sm rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    :placeholder="$t('city')"
                  />
                  <div
                    v-if="cityOptions.length"
                    class="absolute z-10 bg-white shadow-lg w-full mt-1 max-h-48 overflow-y-auto"
                  >
                    <div
                      v-for="city in cityOptions"
                      :key="city.id"
                      @click="selectCity(city)"
                      class="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
                    >
                      {{ city.name }}
                    </div>
                  </div>
                  <p v-if="cityLoading" class="text-xs text-gray-500 mt-1">
                    Loading cities...
                  </p>
                </div>
              </div>
            </div> -->
            <div class="mt-6 pt-6 border-t">
              <h4 class="font-semibold text-sm mb-3 text-gray-900">
                {{ $t("employmentTypes") }}
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
                  <span class="truncate">{{ type.name }}</span>
                </label>
              </div>
            </div>

            <div class="mt-6 pt-6 border-t">
              <h4 class="font-semibold text-sm mb-3 text-gray-900">
                Salary Range
              </h4>
              <div class="space-y-3">
                <div>
                  <label class="block text-xs text-gray-600 mb-1">Min (IDR)</label>
                  <input type="number" v-model="salaryMin" class="w-full border border-gray-200 shadow-sm rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Min salary" />
                </div>
                <div>
                  <label class="block text-xs text-gray-600 mb-1">Max (IDR)</label>
                  <input type="number" v-model="salaryMax" class="w-full border border-gray-200 shadow-sm rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Max salary" />
                </div>
                <button @click="handleFilterChange" class="w-full rounded-md border border-gray-200 shadow-sm px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100">
                  Apply
                </button>
              </div>
            </div>

            <div class="mt-6">
              <button
                @click="resetFilters"
                class="w-full rounded-md border border-gray-200 shadow-sm px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {{ $t("resetFilters") }}
              </button>
            </div>

            <!-- <div class="mt-6 pt-6 border-t">
              <h4 class="font-semibold text-sm mb-3 text-gray-900">
                {{ $t("otherFilters") || "Other Filters" }}
              </h4>

              <div class="space-y-2">
                <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="showRecommendations"
                    @change="handleRecommendationsToggle"
                    class="rounded"
                  />
                  <span class="flex items-center gap-1">
                    <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    {{ $t("showRecommendations") || "Show Recommendations" }}
                  </span>
                </label>
              </div>
            </div> -->
          </div>
        </aside>

        <!-- Job Listings -->
        <main class="flex-1">
          <!-- Mobile Filter Button -->
          <div class="lg:hidden mb-4 flex items-center justify-between">
            <button
              @click="showFilters = !showFilters"
              class="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow text-gray-700"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span>{{ $t("filter") }}</span>
            </button>

            <div v-if="canUseRecommendations" class="flex items-center gap-2">
              <div class="flex items-center gap-2">
                <span v-if="recommendations" class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  <span>{{ $t("recommended") || "Recommended" }}</span>
                </span>
                <div class="text-sm text-gray-600">
                  {{ totalData }} {{ $t("vacancies") }}
                </div>
              </div>
            </div>
            <div v-else class="flex items-center gap-2">
              <div class="text-sm text-gray-600">
                {{ totalData }} {{ $t("vacancies") }}
              </div>
            </div>
          </div>

          <!-- Recommendations Banner (Only if logged in) -->
          <div v-if="canUseRecommendations && recommendations" class="bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-4 mb-4">
            <div class="flex items-center gap-3">
              <div class="shrink-0">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900">{{ $t("recommendedForYou") || "Recommended for you" }}</h3>
                <p class="text-sm text-gray-600">{{ $t("recommendedJobsDesc") || "Jobs matched based on your profile and preferences" }}</p>
              </div>
            </div>
          </div>

          <!-- Results Header -->
          <div class="bg-white rounded-lg shadow p-4 mb-4 hidden lg:block">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-900">
                <span v-if="!recommendations">{{ $t("found") }} {{ totalData }} {{ $t("vacancies") }}</span>
                <span v-else>{{ totalData }} {{ $t("recommendedVacancies") || "recommended vacancies" }}</span>
              </h2>
              <select
                v-model="sortBy"
                @change="handleFilterChange"
                class="px-4 py-2 border border-gray-300 shadow-sm rounded text-sm text-gray-700"
                :disabled="recommendations"
              >
                <option value="" disabled selected>{{ $t("sortBy") }}</option>
                <option value="latest">{{ $t("latest") }}</option>
                <option value="oldest">{{ $t("oldest") }}</option>
                <option value="highest-salary">
                  {{ $t("highestSalary") }}
                </option>
              </select>
            </div>
          </div>

          <!-- Job Cards -->
          <div class="flex flex-col">
            <!-- Loading State -->
            <div
              v-if="loading"
              class="bg-white rounded-lg shadow p-8 text-center"
            >
              <div class="animate-pulse">
                <div class="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
                <div class="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            </div>

            <!-- Job List -->
            <div v-else>
              <div
                v-for="job in jobs"
                :key="job.id"
                class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4 sm:p-5 md:p-6 cursor-pointer mb-6 last:mb-0"
                @click="viewJobDetail(job.id)"
              >
                <!-- Mobile-first card: image on top, content below -->
                <div class="flex flex-col gap-3">
                  <div class="w-full sm:w-28 sm:shrink-0">
                    <div
                      class="w-full h-40 sm:h-20 overflow-hidden rounded shadow-sm bg-gray-50 flex items-center justify-center"
                    >
                      <img
                        :src="
                          job.avatar_url
                            ? fileStorageUrl + job.avatar_url
                            : '/company-default-image.png'
                        "
                        @error="
                          (e) => (e.target.src = '/company-default-image.png')
                        "
                        :alt="job.company_name"
                        class="max-w-full max-h-full object-contain"
                      />
                    </div>
                  </div>

                  <div class="flex items-start justify-between gap-4">
                    <div class="flex-1 min-w-0">
                      <h3 class="text-lg font-semibold text-gray-900 truncate">
                        {{ job.title }}
                      </h3>

                      <div
                        class="flex items-center gap-3 text-sm text-gray-600 mt-1 flex-wrap"
                      >
                        <div class="flex items-center gap-1 truncate">
                          <svg
                            class="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"
                            />
                          </svg>
                          <span class="truncate">{{ job.company_name }}</span>
                        </div>
                        <div
                          class="flex items-center gap-1 text-gray-500 truncate"
                        >
                          <svg
                            class="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                          </svg>
                          <span class="truncate">{{ job.location }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="shrink-0 text-right">
                      <div class="text-green-600 font-semibold text-sm">
                        {{ formatNumber(job.salary_min) }} -
                        {{ formatNumber(job.salary_max) }}
                      </div>
                      <div class="text-gray-500 text-xs mt-1">
                        <div class="whitespace-nowrap">{{ job.currency }}</div>
                        <div class="mt-1">
                          {{ job.employment_type }} ·
                          {{ timeAgo(job.created_at) }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p class="text-sm text-gray-600 mt-1 line-clamp-2">
                    {{ job.description }}
                  </p>

                  <!-- arrow for larger screens -->
                  <div class="hidden sm:flex items-center justify-end">
                    <svg
                      class="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <nav aria-label="Pagination" class="mt-6">
            <div
              class="flex items-center justify-center gap-3 flex-nowrap overflow-x-auto px-2"
            >
              <!-- Previous -->
              <button
                @click="prevPage"
                :disabled="currentPage === 1"
                :aria-disabled="currentPage === 1"
                title="Previous"
                class="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm whitespace-nowrap"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 19l-7-7 7-7"
                  ></path>
                </svg>
                <span class="sr-only">Previous</span>
                <span class="ml-1">{{ $t("previous") || "Previous" }}</span>
              </button>

              <!-- Page buttons (single row) -->
              <div class="flex items-center gap-2 flex-nowrap">
                <button
                  v-for="page in displayPages"
                  :key="page"
                  @click="goToPage(page)"
                  :aria-current="currentPage === page ? 'page' : false"
                  :class="[
                    'px-3 py-2 rounded-md text-sm shadow-sm whitespace-nowrap',
                    currentPage === page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
                  ]"
                  :title="`Go to page ${page}`"
                >
                  {{ page }}
                </button>
              </div>

              <!-- Next -->
              <button
                @click="nextPage"
                :disabled="currentPage === totalPages"
                :aria-disabled="currentPage === totalPages"
                title="Next"
                class="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm whitespace-nowrap"
              >
                <span class="mr-1">{{ $t("next") || "Next" }}</span>
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  ></path>
                </svg>
              </button>
            </div>
          </nav>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "../stores/authStore";
import HeroSearch from "../components/home/HeroSearch.vue";
import { getJobPosts } from "../services/jobposts.api";
import { getCategoriesWithJobcount } from "../services/categories.api";
import api from "../services/api";
import { useRoute, useRouter } from "vue-router";
import { getEmploymentTypes } from "../services/employment_types.api";

const { t } = useI18n();
const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

// State
const fileStorageUrl = import.meta.env.VITE_FILE_STORAGE_URL;
const jobs = ref([]);
const categories = ref([]);
const loading = ref(true);
const searchQuery = ref("");
const selectedCategory = ref("");
const showFilters = ref(false);
const sortBy = ref("highest-salary");
const currentPage = ref(1);
const totalPages = ref(5);
const totalData = ref(0);
const CATEGORY_LIMIT = 6;
const showAllCategories = ref(false);
const employmentTypes = ref([]);
const selectedEmploymentTypes = ref([]);
const recommendations = ref(false);
const provinceInput = ref("");
const cityInput = ref("");
const selectedProvince = ref("");
const selectedCity = ref("");
const provinceOptions = ref([]);
const cityOptions = ref([]);
const provinceLoading = ref(false);
const cityLoading = ref(false);
const selectedProvinceId = ref(null);
const isProvinceActive = ref(false);
const isCityActive = ref(false);
let provinceTimeout = null;
let cityTimeout = null;
const salaryMin = ref(null);
const salaryMax = ref(null);

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
    : categories.value.slice(0, CATEGORY_LIMIT);
});

const canUseRecommendations = computed(
  () => auth.isLoggedIn && auth.role !== "recruiter",
);

const formatNumber = (num) => new Intl.NumberFormat("en-US").format(num);

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();

  const seconds = Math.floor((now - date) / 1000);

  const units = [
    { name: "year", seconds: 31536000 },
    { name: "month", seconds: 2592000 },
    { name: "day", seconds: 86400 },
    { name: "hour", seconds: 3600 },
    { name: "minute", seconds: 60 },
  ];

  for (const unit of units) {
    const value = Math.floor(seconds / unit.seconds);
    if (value >= 1) {
      return `posted ${new Intl.RelativeTimeFormat("en", {
        numeric: "always",
      }).format(-value, unit.name)}`;
    }
  }

  return "posted just now";
}

async function fetchProvinces(search = "") {
  if (!search.trim()) {
    provinceOptions.value = [];
    return;
  }

  try {
    provinceLoading.value = true;
    const res = await api.get("/locations/search", {
      params: {
        search,
        type: "provinces",
      },
    });
    provinceOptions.value = res.data?.data?.provinces || [];
  } catch (err) {
    console.error("Failed to fetch provinces:", err);
    provinceOptions.value = [];
  } finally {
    provinceLoading.value = false;
  }
}

async function fetchCities(search = "") {
  if (!selectedProvinceId.value || !search.trim()) {
    cityOptions.value = [];
    return;
  }

  try {
    cityLoading.value = true;
    const res = await api.get("/locations/search", {
      params: {
        search,
        type: "cities",
        province_id: selectedProvinceId.value,
      },
    });
    cityOptions.value = res.data?.data?.cities || [];
  } catch (err) {
    console.error("Failed to fetch cities:", err);
    cityOptions.value = [];
  } finally {
    cityLoading.value = false;
  }
}

async function resolveProvinceIdByName(name) {
  if (!name.trim()) return;

  const res = await api.get("/locations/search", {
    params: {
      search: name,
      type: "provinces",
    },
  });
  const provinces = res.data?.data?.provinces || [];
  const match = provinces.find((p) => p.name === name) || provinces[0];
  if (match) {
    selectedProvinceId.value = match.id;
  }
}

watch(provinceInput, (val) => {
  if (!isProvinceActive.value) return;

  selectedProvince.value = "";
  selectedCity.value = "";

  if (!val) {
    provinceOptions.value = [];
    selectedProvinceId.value = null;
    cityInput.value = "";
    cityOptions.value = [];
    return;
  }

  clearTimeout(provinceTimeout);
  provinceTimeout = setTimeout(() => {
    fetchProvinces(val);
  }, 300);
});

watch(cityInput, (val) => {
  if (!isCityActive.value) return;

  selectedCity.value = "";

  if (!val) {
    cityOptions.value = [];
    return;
  }

  clearTimeout(cityTimeout);
  cityTimeout = setTimeout(() => {
    fetchCities(val);
  }, 300);
});

function selectProvince(province) {
  selectedProvinceId.value = province.id;
  selectedProvince.value = province.name;
  provinceInput.value = province.name;
  provinceOptions.value = [];
  selectedCity.value = "";
  cityInput.value = "";
  cityOptions.value = [];
  handleFilterChange();
}

function selectCity(city) {
  selectedCity.value = city.name;
  cityInput.value = city.name;
  cityOptions.value = [];
  handleFilterChange();
}

async function handleProvinceFocus() {
  isProvinceActive.value = true;
  await fetchProvinces(provinceInput.value || "_");
}

async function handleCityFocus() {
  isCityActive.value = true;
  await fetchCities(cityInput.value || "_");
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
        recommendations:filters.recommendations,
        page: filters.page,
        limit: filters.limit,
      };

      // Check if any filter is active
      let hasActiveFilters = false;
      // recommendations.value = false;

      if (filters.search && filters.search.trim() !== "") {
        params.search = filters.search.trim();
        hasActiveFilters = true;
      }

      if (filters.category !== "") {
        params.category = filters.category;
        hasActiveFilters = true;
      }

      if (filters.employmentTypes?.length) {
        params.employment_type = filters.employmentTypes.join(",");
        hasActiveFilters = true;
      }

      if (filters.province_name) {
        params.province_name = filters.province_name;
        hasActiveFilters = true;
      }

      if (filters.cities_name) {
        params.cities_name = filters.cities_name;
        hasActiveFilters = true;
      }

      if (filters.salaryMin && filters.salaryMin !== null) {
        params.salary_min = filters.salaryMin;
        hasActiveFilters = true;
      }

      if (filters.salaryMax && filters.salaryMax !== null) {
        params.salary_max = filters.salaryMax;
        hasActiveFilters = true;
      }

      if (filters.sortBy && filters.sortBy !== "" && filters.sortBy !== "created_at") {
        hasActiveFilters = true;
        if (filters.sortBy === "latest") {
          params.sort_by = "created_at";
          params.sort_order = "desc";
        } else if (filters.sortBy === "oldest") {
          params.sort_by = "created_at";
          params.sort_order = "asc";
        } else if (filters.sortBy === "highest-salary") {
          params.sort_by = "salary_max";
          params.sort_order = "desc";
        }
      }
      // params.recommendations = filters.recommendations;
      // If no filters are active OR showRecommendations is checked, add recommendations parameter
      if (!hasActiveFilters || filters.recommendations) {
        params.recommendations = filters.recommendations;
        // recommendations.value = true;
      }

      const response = await getJobPosts(params);
      return response.data;
    } catch (error) {
      console.error("Error fetching jobs:", error);
      throw error;
    }
  },

  async fetchCategories() {
    try {
      const response = await getCategoriesWithJobcount();
      return response.data;
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  },

  async fetchEmploymentTypes() {
    try {
      const response = await getEmploymentTypes();
      return response.data;
    } catch (error) {
      console.error("Error fetching employment types:", error);
      throw error;
    }
  },
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
      province_name: selectedProvince.value,
      cities_name: selectedCity.value,
      salaryMin: salaryMin.value,
      salaryMax: salaryMax.value,
      sortBy: sortBy.value,
      page: currentPage.value,
      recommendations: recommendations.value,
      limit: 5,
    });
    jobs.value = data.data;
    totalPages.value = data.meta.totalPage;
    totalData.value = data.meta.total;
  } catch (error) {
    console.error("Error loading jobs:", error);
  } finally {
    loading.value = false;
  }
};

const loadCategories = async () => {
  try {
    const data = await jobService.fetchCategories();
    categories.value = data.data;
  } catch (error) {
    console.error("Error loading categories:", error);
  }
};

const loadEmploymentTypes = async () => {
  try {
    const data = await jobService.fetchEmploymentTypes();
    employmentTypes.value = data.data;
  } catch (err) {
    console.error("Error loading employment types:", err);
  }
};

const handleSearchFromHero = (value) => {
  const keyword = value?.trim();

  // Buat copy query yang ada sekarang
  const newQuery = { ...route.query };

  if (!keyword) {
    // Jika kosong, hapus property search dari object query
    searchQuery.value = "";
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

function handleSearch(keyword, location) {
  const query = { page: 1, recommendations: "false" };

  if (keyword && keyword.trim()) {
    query.search = keyword.trim();
  }

  if (location) {
    query.province_name = location.name;
  }

  router.push({ path: "/jobposts", query });
}
const viewJobDetail = (jobId) => {
  router.push({
    name: "JobDetail", // Harus match dengan 'name' di router/index.js
    params: { id: jobId },
  });
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
      page: page,
    },
  });
};

const handleFilterChange = () => {
  searchQuery.value = ""; // Reset search saat filter diubah
  recommendations.value = false; // Disable recommendations when any filter changes
  router.push({
    query: {
      sort_by: sortBy.value || undefined,
      category: selectedCategory.value || undefined,
      search: undefined, // Hapus search dari query
      employment_types: selectedEmploymentTypes.value.length
        ? selectedEmploymentTypes.value.join(",")
        : undefined,
      province_name: selectedProvince.value || undefined,
      cities_name: selectedCity.value || undefined,
      salary_min: salaryMin.value || undefined,
      salary_max: salaryMax.value || undefined,
      recommendations: "false",
      page: 1, // Reset ke 1 hanya saat fungsi ini dipanggil
    },
  });
};

const resetFilters = () => {
  searchQuery.value = "";
  selectedCategory.value = "";
  selectedEmploymentTypes.value = [];
  selectedProvince.value = "";
  selectedCity.value = "";
  selectedProvinceId.value = null;
  provinceInput.value = "";
  cityInput.value = "";
  provinceOptions.value = [];
  cityOptions.value = [];
  salaryMin.value = null;
  salaryMax.value = null;
  sortBy.value = "";
  currentPage.value = 1;

  router.push({ query: {} });
};

const resetCategory = () => {
  selectedCategory.value = ""; // Reset state internal

  // Buat copy dari query saat ini
  const query = { ...route.query };
  
  // Hapus key category dan recommendations dari object query
  delete query.category;
  delete query.recommendations;

  // Reset ke halaman 1 saat ganti kategori
  query.page = 1;
  
  // Navigasi dengan query yang sudah bersih
  router.push({ query });
};

const enableRecommendations = () => {
  if (!canUseRecommendations.value) return;

  recommendations.value = true;
  selectedCategory.value = "";
  selectedEmploymentTypes.value = [];
  selectedProvince.value = "";
  selectedCity.value = "";
  selectedProvinceId.value = null;
  provinceInput.value = "";
  cityInput.value = "";
  salaryMin.value = null;
  salaryMax.value = null;
  sortBy.value = "";
  searchQuery.value = "";
  
  router.push({
    query: {
      recommendations: "true",
      page: 1,
    },
  });
};

const disableRecommendations = () => {
  recommendations.value = false;
  
  router.push({
    query: {
      recommendations: "false",
      page: 1,
    },
  });
};

const handleRecommendationsToggle = () => {
  router.push({
    query: {
      ...route.query,
      recommendations: recommendations.value ? "true" : "false",
      page: 1,
    },
  });
};

// Watchers

watch(
  () => route.query,
  (q) => {
    searchQuery.value = q.search || "";
    selectedCategory.value = q.category || "";
    sortBy.value = q.sort_by || "";
    selectedEmploymentTypes.value = q.employment_types
      ? q.employment_types.split(",")
      : [];
    currentPage.value = Number(q.page || 1);
    selectedProvince.value = q.province_name || "";
    selectedCity.value = q.cities_name || "";
    salaryMin.value = q.salary_min ? Number(q.salary_min) : null;
    salaryMax.value = q.salary_max ? Number(q.salary_max) : null;
    if (q.province_name) {
      provinceInput.value = q.province_name;
      resolveProvinceIdByName(q.province_name).catch(() => null);
    } else {
      provinceInput.value = "";
      selectedProvinceId.value = null;
    }
    cityInput.value = q.cities_name || "";
    
    // Determine if we should show recommendations
    const hasActiveFilters = !!(
      q.search ||
      q.category ||
      (q.employment_types && q.employment_types.length > 0) ||
      (q.sort_by && q.sort_by !== "" && q.sort_by !== "created_at") ||
      q.province_name ||
      q.cities_name ||
      q.salary_min !== undefined ||
      q.salary_max !== undefined
    );
    
    // Recommendations only for non-recruiter logged-in users
    if (
      canUseRecommendations.value &&
      !hasActiveFilters &&
      q.recommendations === undefined
    ) {
      recommendations.value = true;
    } else if (canUseRecommendations.value && q.recommendations === "true") {
      recommendations.value = true;
    } else {
      recommendations.value = false;
    }

    loadJobs();
  },
  { immediate: true },
);

// Lifecycle
onMounted(() => {
  loadCategories();
  loadEmploymentTypes();
  // recommendations.value = true;
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
