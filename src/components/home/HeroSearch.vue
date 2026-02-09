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
      <div class="flex flex-col sm:flex-row items-stretch gap-3">
        <input
          type="text"
          v-model="keyword"
          @keydown.enter="handleSearch"
          class="bg-white text-black flex-1 min-w-0 px-4 py-3 rounded-md shadow-sm focus:outline-none"
          :placeholder="t('home.keywordPlaceholder')"
        />

        <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            @click="handleSearch"
            class="w-full sm:w-auto bg-pink-600 text-white px-4 py-3 rounded-md font-semibold hover:scale-105 transition duration-150"
          >
            {{ t("home.findJobs") }}
          </button>

          <button
            @click="handlePickUpJobs"
            :disabled="isLoadingPickup"
            class="w-full sm:w-auto bg-white text-blue-600 px-4 py-3 rounded-md font-semibold hover:scale-105 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoadingPickup ? t("loading") : t("home.pickUpJobs") }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import { getJobPosts } from "../../services/jobposts.api";

const { t } = useI18n();
const router = useRouter();

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue", "search"]);
const keyword = ref(props.modelValue || "");
const isLoadingPickup = ref(false);

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

function handleSearch() {
  emit("search", keyword.value);
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
