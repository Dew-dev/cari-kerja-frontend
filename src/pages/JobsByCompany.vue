<template>
  <div class="min-h-screen bg-gray-50">
    <section class="bg-[#0a9cf5] text-white">
      <div class="max-w-290 mx-auto py-12 px-4">
        <h1 class="text-4xl font-bold mb-3">
          {{ $t("jobsByCompany") || "Jobs by Company" }}
        </h1>
        <p class="text-white/90 mb-8">
          {{ $t("browseByCompanySubtitle") || "Explore companies grouped by industry" }}
        </p>
      </div>
    </section>

    <div class="max-w-290 mx-auto px-4 py-8">
      <nav class="mb-6">
        <ol class="flex items-center gap-2 text-sm text-gray-600">
          <li>
            <router-link to="/" class="hover:text-blue-600">{{ $t("home.home") }}</router-link>
          </li>
          <li>/</li>
          <li class="text-gray-900 font-medium">{{ $t("companies") || "Companies" }}</li>
        </ol>
      </nav>

      <div class="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div class="inline-flex items-center rounded-lg bg-white p-1 shadow-sm border border-gray-200">
          <button
            type="button"
            @click="setActiveTab('industry')"
            class="px-4 py-2 text-sm font-medium rounded-md transition"
            :class="activeTab === 'industry' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'"
          >
            {{ $t("industry") || "Industry" }}
          </button>
          <button
            type="button"
            @click="setActiveTab('all')"
            class="px-4 py-2 text-sm font-medium rounded-md transition"
            :class="activeTab === 'all' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'"
          >
            {{ $t("all") || "All" }}
            <span v-if="allMeta.total > 0" class="ml-1">({{ allMeta.total }})</span>
          </button>
        </div>

        <div class="relative w-full md:max-w-md">
          <input
            v-model="companySearch"
            type="text"
            class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            :placeholder="$t('searchCompany') || 'Search company'"
          />
          <svg
            class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <div v-if="activeTab === 'all' && companySearch.trim()" class="mb-4 text-sm text-gray-700">
        {{ $t("searchResultsFor") || "Search results for" }}
        <span class="font-semibold">"{{ companySearch.trim() }}"</span>
        <span class="text-gray-500">({{ allMeta.total || 0 }})</span>
      </div>

      <div v-else-if="activeTab === 'all'" class="mb-4 text-sm text-gray-700">
        {{ $t("companies") || "Companies" }}:
        <span class="font-semibold">{{ allMeta.total || 0 }}</span>
      </div>

      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="n in 6" :key="n" class="bg-white rounded-lg shadow p-6 animate-pulse">
          <div class="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>

      <template v-else>
        <div v-if="activeTab === 'industry' && industryGroups.length">
          <div v-for="group in industryGroups" :key="group.industryName" class="mb-10">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">
              {{ group.industryName }}
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                v-for="recruiter in group.recruiters"
                :key="recruiter.id || recruiter.recruiter_id || recruiter.company_name"
                type="button"
                @click="goToRecruiterProfile(recruiter)"
                class="bg-white rounded-lg shadow hover:shadow-lg transition-all p-4 text-left group"
              >
                <div class="flex items-center gap-3">
                  <img
                    v-if="getAvatarUrl(recruiter)"
                    :src="getAvatarUrl(recruiter)"
                    :alt="recruiter.company_name || recruiter.name"
                    class="h-12 w-12 rounded-full object-cover"
                  />
                  <div
                    v-else
                    class="h-12 w-12 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center"
                  >
                    {{ getInitials(recruiter.company_name || recruiter.name || "Company") }}
                  </div>

                  <div class="min-w-0">
                    <h3 class="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition line-clamp-1">
                      {{ recruiter.company_name || recruiter.name || "Company" }}
                    </h3>
                    <p class="text-sm text-gray-600">
                      {{ recruiter.job_count || recruiter.job_posts_count || 0 }} {{ $t("jobs") }}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'all' && allCompanies.length">
          <div class="space-y-4">
            <button
              v-for="company in allCompanies"
              :key="company.id"
              type="button"
              @click="goToRecruiterProfile(company)"
              class="w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg group"
            >
              <div class="flex items-start gap-6">
                <!-- Logo/Avatar Section -->
                <div class="shrink-0">
                  <img
                    v-if="getAvatarUrl(company)"
                    :src="getAvatarUrl(company)"
                    :alt="company.company_name || company.name"
                    class="h-20 w-20 rounded-xl object-cover ring-1 ring-gray-200"
                  />
                  <div
                    v-else
                    class="h-20 w-20 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 font-bold text-xl flex items-center justify-center"
                  >
                    {{ getInitials(company.company_name || company.name || "Company") }}
                  </div>
                </div>

                <!-- Main Content Section -->
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap mb-2">
                    <h3 class="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition">
                      {{ company.company_name || company.name || "Company" }}
                    </h3>
                    <span
                      v-if="company.is_vip"
                      class="inline-flex shrink-0 items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700"
                    >
                      ⭐ VIP
                    </span>
                  </div>

                  <p class="text-sm font-medium text-gray-600 mb-3">
                    {{ company.industry_name || "" }}
                  </p>

                  <!-- Description Section -->
                  <p v-if="company.description" class="text-base text-gray-700 line-clamp-2 mb-4">
                    {{ company.description }}
                  </p>
                  <p v-else class="text-base text-gray-400 italic mb-4">
                    {{ $t("noDescriptionProvided") || "No description provided" }}
                  </p>

                  <div class="flex flex-wrap items-center gap-4 text-sm text-gray-900 mb-5">
<span v-if="company.address" class="flex items-center gap-1.5">
                      📍 {{ company.address }}
                    </span>
                    <span v-else class="flex items-center gap-1.5 text-gray-400">
                      📍 {{ $t("noAddressProvided") || "Address not provided" }}
                    </span>
                  </div>
                  <!-- Contact & Info Section -->
                  <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span v-if="company.contact_name" class="flex items-center gap-1.5">
                      👤 {{ company.contact_name }}
                    </span>
                    <span v-else class="flex items-center gap-1.5 text-gray-400">
                      👤 {{ $t("noContactNameProvided") || "Contact name not provided" }}
                    </span>

                    <span v-if="company.contact_phone" class="flex items-center gap-1.5">
                      📞 {{ company.contact_phone }}
                    </span>
                    <span v-else class="flex items-center gap-1.5 text-gray-400">
                      📞 {{ $t("noContactPhoneProvided") || "Contact phone not provided" }}
                    </span>

                    <span v-if="company.company_website" class="flex items-center gap-1.5 text-blue-600 hover:text-blue-700">
                      🔗 {{ company.company_website }}
                    </span>
                    <span v-else class="flex items-center gap-1.5 text-gray-400">
                      🔗 {{ $t("noWebsiteProvided") || "Website not provided" }}
                    </span>
                  </div>
                </div>

                <!-- Right Side: Job Count & Arrow -->
                <div class="shrink-0 flex flex-col items-end gap-3">
                  <span class="inline-flex items-center rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
                    {{ company.job_count || 0 }} {{ $t("jobs") }}
                  </span>
                  <span class="text-2xl font-light text-blue-600 group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </div>
              </div>
            </button>
          </div>

          <div v-if="allMeta.totalPage > 1" class="mt-8 flex items-center justify-center gap-2">
            <button
              type="button"
              @click="changeAllPage(allMeta.page - 1)"
              :disabled="allMeta.page <= 1"
              class="px-3 py-2 rounded-md border border-gray-300 text-sm text-gray-700 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ $t("previous") || "Previous" }}
            </button>

            <span class="text-sm text-gray-600 px-2">
              {{ allMeta.page }} / {{ allMeta.totalPage }}
            </span>

            <button
              type="button"
              @click="changeAllPage(allMeta.page + 1)"
              :disabled="allMeta.page >= allMeta.totalPage"
              class="px-3 py-2 rounded-md border border-gray-300 text-sm text-gray-700 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ $t("next") || "Next" }}
            </button>
          </div>
        </div>

        <div v-else class="bg-white rounded-lg shadow p-12 text-center text-gray-600">
          {{ $t("noCompaniesAvailable") || "No companies available" }}
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import {
  getRecruiterCompanies,
  getRecruitersGroupedByIndustry,
} from "../services/recruiters.api";

const router = useRouter();
const loading = ref(false);
const activeTab = ref("industry");

const industryGroups = ref([]);
const allCompanies = ref([]);
const allMeta = ref({
  page: 1,
  limit: 12,
  total: 0,
  totalPage: 1,
});

const companySearch = ref("");
let searchTimeout = null;

const fileStorageOrigin = (() => {
  try {
    const baseUrl = import.meta.env.VITE_FILE_STORAGE_URL || "http://localhost:5000";
    return new URL(baseUrl).origin;
  } catch {
    return "http://localhost:5000";
  }
})();

function normalizeGroups(payload) {
  const data = payload?.data || payload || [];

  if (Array.isArray(data)) {
    return data.map((item) => ({
      industryName: item.industry_name || item.industry || "Other",
      recruiters: item.recruiters || item.companies || item.items || [],
    }));
  }

  if (typeof data === "object" && data !== null) {
    return Object.entries(data).map(([industryName, recruiters]) => ({
      industryName,
      recruiters: Array.isArray(recruiters) ? recruiters : [],
    }));
  }

  return [];
}

function getInitials(name) {
  return String(name || "C")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getAvatarUrl(recruiter) {
  const rawUrl = recruiter.logo_url || recruiter.avatar_url || "";
  if (!rawUrl) return "";
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  return `${fileStorageOrigin}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
}

function goToRecruiterProfile(recruiter) {
  const recruiterId = recruiter.id || recruiter.recruiter_id;
  if (!recruiterId) return;

  router.push({
    name: "public-recruiter-profile",
    params: { id: recruiterId },
  });
}

async function fetchGroupedCompanies() {
  try {
    loading.value = true;
    const response = await getRecruitersGroupedByIndustry();
    industryGroups.value = normalizeGroups(response);
  } catch (error) {
    console.error("Failed to fetch grouped companies:", error);
    industryGroups.value = [];
  } finally {
    loading.value = false;
  }
}

async function fetchAllCompanies() {
  try {
    loading.value = true;
    const params = {
      page: allMeta.value.page,
      limit: allMeta.value.limit,
    };

    const keyword = companySearch.value.trim();
    if (keyword) {
      params.search = keyword;
    }

    const response = await getRecruiterCompanies(params);
    allCompanies.value = response?.data || [];

    const meta = response?.meta || {};
    allMeta.value = {
      page: Number(meta.page || allMeta.value.page || 1),
      limit: Number(meta.limit || allMeta.value.limit || 12),
      total: Number(meta.total || 0),
      totalPage: Number(meta.totalPage || 1),
    };
  } catch (error) {
    console.error("Failed to fetch companies:", error);
    allCompanies.value = [];
    allMeta.value = {
      ...allMeta.value,
      total: 0,
      totalPage: 1,
    };
  } finally {
    loading.value = false;
  }
}

function setActiveTab(tab) {
  if (activeTab.value === tab) return;
  activeTab.value = tab;

  if (tab === "all") {
    allMeta.value.page = 1;
    fetchAllCompanies();
  }
}

function changeAllPage(nextPage) {
  if (nextPage < 1 || nextPage > allMeta.value.totalPage) return;
  allMeta.value.page = nextPage;
  fetchAllCompanies();
}

watch(companySearch, () => {
  clearTimeout(searchTimeout);

  searchTimeout = setTimeout(() => {
    activeTab.value = "all";
    allMeta.value.page = 1;
    fetchAllCompanies();
  }, 350);
});

onMounted(fetchGroupedCompanies);
</script>
