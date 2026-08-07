<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { getJobPosts } from "@/services/jobposts.api";
import { usePreferredLocation } from "@/composables/usePreferredLocation";
import { stripHtml } from "@/utils/richText";
import { maskNumber } from "@/utils/numberMask";

const { t } = useI18n();
const router = useRouter();
const { preferredLocation, hasPreferredCity, label, jobListQuery } =
  usePreferredLocation();

const jobs = ref([]);
const loading = ref(false);
const empty = ref(false);

const title = computed(() =>
  hasPreferredCity.value
    ? t("jobsNearYou.titleWithCity", { city: preferredLocation.value.city })
    : t("jobsNearYou.title"),
);

async function loadJobs() {
  if (!hasPreferredCity.value) {
    jobs.value = [];
    empty.value = false;
    return;
  }

  loading.value = true;
  empty.value = false;
  try {
    const res = await getJobPosts({
      cities_name: preferredLocation.value.city,
      limit: 6,
      page: 1,
    });
    jobs.value = res.data?.data || [];
    empty.value = jobs.value.length === 0;
  } catch (err) {
    console.error("Failed to load jobs near you:", err);
    jobs.value = [];
    empty.value = true;
  } finally {
    loading.value = false;
  }
}

function goToJob(id) {
  router.push({ name: "JobDetail", params: { id } });
}

function seeAll() {
  router.push({ path: "/jobposts", query: jobListQuery() });
}

function pickCity() {
  router.push("/cities");
}

watch(
  () => preferredLocation.value?.city,
  () => {
    loadJobs();
  },
);

onMounted(loadJobs);
</script>

<template>
  <section class="bg-slate-50 px-4 py-12">
    <div class="max-w-290 mx-auto">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
        <div>
          <h2 class="text-2xl md:text-3xl font-bold text-slate-900">{{ title }}</h2>
          <p class="text-slate-600 mt-1 text-sm md:text-base">
            <template v-if="hasPreferredCity">
              {{ t("jobsNearYou.subtitleWithCity", { location: label }) }}
            </template>
            <template v-else>
              {{ t("jobsNearYou.subtitleEmpty") }}
            </template>
          </p>
        </div>
        <button
          v-if="hasPreferredCity"
          type="button"
          class="text-sm font-semibold text-blue-600 hover:text-blue-700"
          @click="seeAll"
        >
          {{ t("jobsNearYou.seeAll") }} →
        </button>
      </div>

      <!-- No preferred city yet -->
      <div
        v-if="!hasPreferredCity"
        class="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center"
      >
        <p class="text-slate-600 mb-4">{{ t("jobsNearYou.chooseCityHint") }}</p>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
          @click="pickCity"
        >
          {{ t("jobsNearYou.chooseCity") }}
        </button>
      </div>

      <div v-else-if="loading" class="text-center py-10 text-slate-500 text-sm">
        {{ t("loading") || "Loading..." }}
      </div>

      <div
        v-else-if="empty"
        class="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center"
      >
        <p class="text-slate-600 mb-4">
          {{ t("jobsNearYou.empty", { city: preferredLocation.city }) }}
        </p>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
          @click="$router.push('/jobposts')"
        >
          {{ t("browseAllJobs") || "Browse All Jobs" }}
        </button>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <button
          v-for="job in jobs"
          :key="job.id"
          type="button"
          class="text-left bg-white rounded-xl p-5 border border-slate-200 hover:border-blue-300 hover:shadow-md transition cursor-pointer"
          @click="goToJob(job.id)"
        >
          <h3 class="text-base font-bold text-slate-900 line-clamp-2">{{ job.title }}</h3>
          <p class="text-sm text-slate-600 mt-1">{{ job.company_name }}</p>
          <div class="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <i class="pi pi-map-marker text-pink-500 text-xs"></i>
            <span class="truncate">{{ job.location || job.city || "-" }}</span>
          </div>
          <div
            v-if="job.salary_min || job.salary_max"
            class="mt-2 text-sm font-semibold text-emerald-700"
          >
            <span v-if="job.salary_min">{{ maskNumber(job.salary_min) }}</span>
            <span v-if="job.salary_min && job.salary_max"> – </span>
            <span v-if="job.salary_max">{{ maskNumber(job.salary_max) }}</span>
            <span v-if="job.currency" class="ml-1 font-normal text-slate-500">{{ job.currency }}</span>
          </div>
          <p class="mt-3 text-sm text-slate-600 line-clamp-2">{{ stripHtml(job.description) }}</p>
        </button>
      </div>
    </div>
  </section>
</template>
