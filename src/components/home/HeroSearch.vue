<template>
  <!-- FULL WIDTH BACKGROUND -->
  <section class="bg-[#0a9cf5] text-white">
    <!-- CENTERED CONTENT -->
    <div class="max-w-290 w-full mx-auto py-10 px-4 sm:py-12">
      <h1 class="text-3xl sm:text-4xl font-bold mb-2 sm:mb-3">
        {{ t("home.title") }}
      </h1>

      <p class="text-white/90 mb-6 sm:mb-8">
        {{ t("home.subtitle") }}
      </p>

      <!-- SEARCH BAR: stacked on mobile, inline on sm+ -->
      <div class="flex flex-col sm:flex-row items-stretch gap-0 bg-white rounded-md shadow-lg">
        <!-- Keyword Input -->
        <div class="flex-1 relative border-b sm:border-b-0 sm:border-r border-gray-200 overflow-hidden">
          <input
            type="text"
            v-model="keyword"
            @keydown.enter="handleSearch"
            class="w-full px-4 py-3 text-black focus:outline-none"
            :placeholder="t('home.keywordPlaceholder')"
          />
        </div>

        <!-- Location Select -->
        <div class="relative sm:w-64" ref="locationDropdownRef">
          <button
            @click.stop="toggleLocationDropdown"
            type="button"
            class="w-full px-4 py-3 text-left flex items-center gap-2 text-gray-700 hover:bg-gray-50 focus:outline-none border-b sm:border-b-0 sm:border-r border-gray-200"
          >
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span class="flex-1 truncate">{{ selectedLocationText }}</span>
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Dropdown -->
          <div
            v-show="showLocationDropdown"
            class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-xl max-h-64 overflow-y-auto"
            @click.stop
          >
            <div class="p-2">
              <input
                v-model="locationSearch"
                @input="searchLocations"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                :placeholder="t('searchLocation') || 'Search location...'"
              />
            </div>
            <button
              @click="selectLocation(null)"
              class="w-full px-4 py-2 text-left text-sm text-zinc-950 hover:bg-gray-100 transition-colors"
              :class="{ 'bg-blue-50 text-blue-600': !selectedLocation }"
            >
              {{ t('allLocations') || 'All Locations' }}
            </button>
            <button
              v-for="location in filteredLocations"
              :key="location.id"
              @click="selectLocation(location)"
              class="w-full px-4 py-2 text-left text-sm text-zinc-950 hover:bg-gray-100 transition-colors"
              :class="{ 'bg-blue-50 text-blue-600': selectedLocation?.id === location.id }"
            >
              {{ location.name }}
            </button>
            <div v-if="locationLoading" class="px-4 py-3 text-sm text-gray-500 text-center">
              Loading...
            </div>
          </div>
        </div>

        <!-- Search Button -->
        <button
          @click="handleSearch"
          class="bg-pink-600 text-white px-8 py-3 font-semibold hover:bg-pink-700 transition duration-150 flex items-center justify-center gap-2 overflow-hidden"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {{ t("home.findJobs") }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import { ref, watch, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { getJobPosts } from "@/services/jobposts.api";
import api from "@/services/api";

const { t } = useI18n();
const router = useRouter();

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue", "search", "locationChange"]);
const keyword = ref(props.modelValue || "");
const isLoadingPickup = ref(false);

// Location state
const showLocationDropdown = ref(false);
const selectedLocation = ref(null);
const locationSearch = ref("");
const locations = ref([]);
const locationLoading = ref(false);
const locationDropdownRef = ref(null);
const isTogglingDropdown = ref(false);
let searchTimeout = null;

const selectedLocationText = computed(() => {
  if (!selectedLocation.value) {
    return t('allLocations') || 'All Locations';
  }
  return selectedLocation.value.name;
});

const filteredLocations = computed(() => {
  if (!locationSearch.value.trim()) {
    return locations.value;
  }
  const search = locationSearch.value.toLowerCase();
  return locations.value.filter(loc => 
    loc.name.toLowerCase().includes(search)
  );
});

watch(
  () => props.modelValue,
  (value) => {
    if (value !== keyword.value) {
      keyword.value = value || "";
    }
  },    
);

watch(keyword, (value) => {
  emit("update:modelValue", value);
});

function toggleLocationDropdown() {
  isTogglingDropdown.value = true;
  showLocationDropdown.value = !showLocationDropdown.value;
  console.log('Toggling dropdown:', showLocationDropdown.value);
  if (showLocationDropdown.value && locations.value.length === 0) {
    fetchLocations();
  }
  
  console.log('Toggle dropdown called. Current state:', showLocationDropdown.value);
  setTimeout(() => {
    isTogglingDropdown.value = false;
  }, 100);
}

function selectLocation(location) {
  selectedLocation.value = location;
  showLocationDropdown.value = false;
  // locationSearch.value = "";
  handleSearch(); // Trigger search immediately on location select
  emit("locationChange", location);
}

async function fetchLocations(search = "") {
  try {
    locationLoading.value = true;
    const res = await api.get("/locations/search", {
      params: {
        search: search || "_",
        type: "provinces",
      },
    });
    locations.value = res.data?.data?.provinces || [];
  } catch (err) {
    console.error("Failed to fetch locations:", err);
    locations.value = [];
  } finally {
    locationLoading.value = false;
  }
}

function searchLocations() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchLocations(locationSearch.value);
  }, 300);
}

function handleClickOutside(event) {
  if (isTogglingDropdown.value) return;
  if (locationDropdownRef.value && !locationDropdownRef.value.contains(event.target) && showLocationDropdown.value) {
    showLocationDropdown.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

function handleSearch() {
  emit("search", keyword.value, selectedLocation.value);
}

async function handlePickUpJobs() {
  try {
    isLoadingPickup.value = true;
    const response = await getJobPosts({ limit: 1000 });
    const jobPosts = response.data.data || [];

    if (jobPosts.length === 0) {
      alert(t("home.noJobsAvailable"));
      return;
    }

    const randomIndex = Math.floor(Math.random() * jobPosts.length);
    const randomJob = jobPosts[randomIndex];

    router.push({
      name: "JobDetail",
      params: { id: randomJob.id },
    });
  } catch (error) {
    console.error("Error picking up random job:", error);
    alert(t("home.errorPickingJob"));
  } finally {
    isLoadingPickup.value = false;
  }
}
</script>
