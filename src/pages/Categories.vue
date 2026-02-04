<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <section class="bg-[#0a9cf5] text-white">
      <div class="max-w-290 mx-auto py-12 px-4">
        <h1 class="text-4xl font-bold mb-3">
          {{ $t("browseCategories") }}
        </h1>
        <p class="text-white/90 mb-8">
          {{ $t("browseCategoriesSubtitle") }}
        </p>

        <!-- Search Bar -->
        <div class="max-w-2xl">
          <input
            type="text"
            v-model="searchQuery"
            @input="filterCategories"
            class="w-full bg-white px-4 py-3 rounded text-black hover:scale-101 transition duration-200 ease-in-out"
            :placeholder="$t('searchCategories')"
          />
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <div class="max-w-290 mx-auto px-4 py-8">
      <!-- Breadcrumb -->
      <nav class="mb-6">
        <ol class="flex items-center gap-2 text-sm text-gray-600">
          <li>
            <router-link to="/" class="hover:text-blue-600">{{
              $t("home")
            }}</router-link>
          </li>
          <li>/</li>
          <li class="text-gray-900 font-medium">{{ $t("categories") }}</li>
        </ol>
      </nav>

      <div class="mb-6">
        <router-link
          to="/"
          class="inline-flex items-center gap-2 bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          {{ $t("home.home") }}
        </router-link>
      </div>

      <!-- Results Header -->
      <div class="bg-white rounded-lg shadow p-4 mb-6">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-900">
            {{ filteredCategories.length }} {{ $t("categoriesFound") }}
          </h2>
          <select
            v-model="sortBy"
            @change="sortCategories"
            class="px-4 py-2 border border-gray-300 shadow-sm rounded text-sm text-gray-700"
          >
            <option value="name-asc">{{ $t("nameAZ") }}</option>
            <option value="name-desc">{{ $t("nameZA") }}</option>
            <option value="jobs-desc">{{ $t("mostJobs") }}</option>
            <option value="jobs-asc">{{ $t("leastJobs") }}</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="n in 6"
          :key="n"
          class="bg-white rounded-lg shadow p-6 animate-pulse"
        >
          <div class="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>

      <!-- Categories Grid -->
      <div
        v-else-if="filteredCategories.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <div
          v-for="category in filteredCategories"
          :key="category.id"
          @click="goToCategoryJobs(category.name)"
          class="bg-white rounded-lg shadow hover:shadow-xl transition-all p-6 cursor-pointer group"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-xl group-hover:bg-blue-600 group-hover:text-white transition"
              >
                <span class="pi pi-book"></span>
              </div>
              <div>
                <h3
                  class="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition"
                >
                  {{ category.name }}
                </h3>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600">
              {{ category.job_count }} {{ $t("availableJobs") }}
            </span>
            <svg
              class="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition"
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

      <!-- Empty State -->
      <div
        v-else
        class="bg-white rounded-lg shadow p-12 text-center"
      >
        <svg
          class="w-16 h-16 mx-auto text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">
          {{ $t("noCategoriesFound") }}
        </h3>
        <p class="text-gray-600 mb-6">
          {{ $t("tryDifferentSearch") }}
        </p>
        <button
          @click="clearSearch"
          class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-200"
        >
          {{ $t("clearSearch") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { getCategoriesWithJobcount } from "../services/categories.api";

const { t } = useI18n();
const router = useRouter();

// State
const categories = ref([]);
const searchQuery = ref("");
const loading = ref(true);
const sortBy = ref("name-asc");

// Computed
const filteredCategories = computed(() => {
  let filtered = categories.value;

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter((cat) =>
      cat.name.toLowerCase().includes(query)
    );
  }

  // Sort
  const sorted = [...filtered];
  switch (sortBy.value) {
    case "name-asc":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "name-desc":
      sorted.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case "jobs-desc":
      sorted.sort((a, b) => b.job_count - a.job_count);
      break;
    case "jobs-asc":
      sorted.sort((a, b) => a.job_count - b.job_count);
      break;
  }

  return sorted;
});

// Methods
const loadCategories = async () => {
  try {
    loading.value = true;
    const response = await getCategoriesWithJobcount();
    // Filter only categories with at least 1 job
    categories.value = response.data.data.filter((cat) => cat.job_count > 0);
  } catch (error) {
    console.error("Error loading categories:", error);
  } finally {
    loading.value = false;
  }
};

const filterCategories = () => {
  // Filtering is handled by computed property
};

const sortCategories = () => {
  // Sorting is handled by computed property
};

const goToCategoryJobs = (categoryName) => {
  router.push({
    path: "/jobposts",
    query: { category: categoryName },
  });
};

const clearSearch = () => {
  searchQuery.value = "";
};

// Lifecycle
onMounted(() => {
  loadCategories();
});
</script>

<style scoped>
.hover\:scale-101:hover {
  transform: scale(1.01);
}
</style>
