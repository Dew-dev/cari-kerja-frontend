<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <section class="bg-[#0a9cf5] text-white">
      <div class="max-w-290 mx-auto py-12 px-4">
        <h1 class="text-4xl font-bold mb-3">
          {{ $t("browseByCity") }}
        </h1>
        <p class="text-white/90 mb-8">
          {{ $t("browseByCitySubtitle") }}
        </p>

        <!-- Search Bar -->
        <div class="max-w-2xl">
          <input
            type="text"
            v-model="searchQuery"
            @input="filterCities"
            class="w-full bg-white px-4 py-3 rounded text-black hover:scale-101 transition duration-200 ease-in-out"
            :placeholder="$t('searchCities')"
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
              $t("home.home")
            }}</router-link>
          </li>
          <li>/</li>
          <li class="text-gray-900 font-medium">{{ $t("cities") }}</li>
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

      <!-- Tabs -->
      <div class="bg-white rounded-lg shadow mb-6">
        <div class="border-b border-gray-200">
          <nav class="flex -mb-px">
            <button
              @click="activeTab = 'alphabetical'"
              :class="[
                activeTab === 'alphabetical'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                'flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition'
              ]"
            >
              {{ $t("alphabetically") }}
            </button>
            <button
              @click="activeTab = 'regional'"
              :class="[
                activeTab === 'regional'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                'flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition'
              ]"
            >
              {{ $t("regionally") }}
            </button>
          </nav>
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

      <!-- Alphabetical View -->
      <div v-else-if="activeTab === 'alphabetical' && filteredCities.length > 0">
        <div v-for="(cities, letter) in alphabeticalCities" :key="letter" class="mb-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-4 sticky top-0 bg-gray-50 py-2 z-10">
            {{ letter }}
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="city in cities"
              :key="city.id"
              @click="goToCityJobs(city)"
              class="bg-white rounded-lg shadow hover:shadow-lg transition-all p-4 cursor-pointer group"
            >
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition">
                    {{ city.name }}
                  </h3>
                  <p class="text-sm text-gray-600">{{ city.province_name }}</p>
                </div>
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
        </div>
      </div>

      <!-- Regional View -->
      <div v-else-if="activeTab === 'regional' && filteredCities.length > 0">
        <div v-for="(cities, province) in regionalCities" :key="province" class="mb-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-4 sticky top-0 bg-gray-50 py-2 z-10">
            {{ province }}
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="city in cities"
              :key="city.id"
              @click="goToCityJobs(city)"
              class="bg-white rounded-lg shadow hover:shadow-lg transition-all p-4 cursor-pointer group"
            >
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition">
                    {{ city.name }} 
                  </h3>
                  <p class="text-sm text-gray-600">{{ city.jobs_count }} {{ $t("vacancies") }}</p>
                </div>
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
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="bg-white rounded-lg shadow p-12 text-center">
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
          {{ $t("noCitiesFound") }}
        </h3>
        <p class="text-gray-600">
          {{ $t("tryDifferentSearch") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";

const router = useRouter();
const loading = ref(true);
const searchQuery = ref("");
const activeTab = ref("alphabetical");
const cities = ref([]);

const filteredCities = computed(() => {
  const withVacancies = cities.value.filter(
    (city) => Number(city.jobs_count) > 0
  );
  if (!searchQuery.value.trim()) {
    return withVacancies;
  }
  const search = searchQuery.value.toLowerCase();
  return withVacancies.filter(
    (city) =>
      city.name.toLowerCase().includes(search) ||
      city.province_name.toLowerCase().includes(search)
  );
});

const alphabeticalCities = computed(() => {
  const grouped = {};
  filteredCities.value.forEach((city) => {
    const firstLetter = city.name[0].toUpperCase();
    if (!grouped[firstLetter]) {
      grouped[firstLetter] = [];
    }
    grouped[firstLetter].push(city);
  });

  // Sort letters
  const sortedGroups = {};
  Object.keys(grouped)
    .sort()
    .forEach((key) => {
      sortedGroups[key] = grouped[key].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    });

  return sortedGroups;
});

const regionalCities = computed(() => {
  const grouped = {};
  filteredCities.value.forEach((city) => {
    const province = city.province_name;
    if (!grouped[province]) {
      grouped[province] = [];
    }
    grouped[province].push(city);
  });

  // Sort provinces
  const sortedGroups = {};
  Object.keys(grouped)
    .sort()
    .forEach((key) => {
      sortedGroups[key] = grouped[key].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    });

  return sortedGroups;
});

async function fetchCities() {
  try {
    loading.value = true;
    const response = await api.get("/locations/cities");
    cities.value = response.data?.data || [];
  } catch (error) {
    console.error("Failed to fetch cities:", error);
    cities.value = [];
  } finally {
    loading.value = false;
  }
}

function filterCities() {
  // Filter already handled by computed property
}

function goToCityJobs(city) {
  router.push({
    path: "/jobposts",
    query: {
      cities_name: city.name,
    },
  });
}

onMounted(() => {
  fetchCities();
});
</script>
