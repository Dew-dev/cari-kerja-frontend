<template>
  <section class="bg-gray-50 py-16 mb-20">
    <div class="max-w-290 mx-auto px-4">
      <h2 class="text-3xl font-bold text-center text-gray-800 mb-2">{{ $t("topCompanies") || "Top Companies" }}</h2>
      <p class="text-center text-gray-600 mb-12">{{ $t("companiesHiring") || "Companies actively hiring" }}</p>

      <div class="bg-white rounded-xl shadow-md p-8 overflow-hidden">
        <div v-if="loading" class="text-center py-8 text-gray-600">
          {{ $t("loading") || "Loading..." }}
        </div>

        <div v-else-if="previewCompanies.length" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 items-start">
          <button
            v-for="company in previewCompanies"
            :key="company.id"
            type="button"
            @click="goToRecruiterProfile(company)"
            class="text-center hover:scale-105 transition duration-200 cursor-pointer"
          >
            <div class="h-16 flex items-center justify-center mb-2">
              <img
                v-if="company.logo"
                :src="company.logo"
                :alt="company.name"
                class="h-14 w-14 rounded-full object-cover"
              />
              <span
                v-else
                class="text-xl font-bold text-blue-600 bg-blue-50 rounded-full h-14 w-14 flex items-center justify-center"
              >
                {{ getInitials(company.name) }}
              </span>
            </div>
            <div class="text-sm font-semibold text-gray-700 line-clamp-2">{{ company.name }}</div>
          </button>
        </div>

        <div v-else class="text-center py-8 text-gray-600">
          {{ $t("noCompaniesAvailable") || "No companies available" }}
        </div>

        <div class="text-center mt-8">
          <button
            type="button"
            @click="router.push('/companies')"
            class="text-blue-600 hover:text-blue-700 font-semibold text-sm"
          >
            {{ $t("browseAllCompanies") || "Browse all companies" }} →
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { getRecruitersGroupedByIndustry } from "@/services/recruiters.api";

const router = useRouter();
const loading = ref(false);
const groups = ref([]);
const fileStorageOrigin = (() => {
  try {
    const baseUrl = import.meta.env.VITE_FILE_STORAGE_URL;
    return new URL(baseUrl).origin;
  } catch {
    return import.meta.env.VITE_FILE_STORAGE_URL;
  }
})();

const previewCompanies = computed(() => {
  const flat = groups.value.flatMap((group) => group.recruiters || []);
  const unique = [];
  const seen = new Set();

  for (const recruiter of flat) {
    const recruiterId = recruiter.id || recruiter.recruiter_id;
    if (!recruiterId || seen.has(recruiterId)) continue;
    seen.add(recruiterId);
    unique.push({
      id: recruiterId,
      name: recruiter.company_name || recruiter.name || "Company",
      logo: resolveMediaUrl(recruiter.logo_url || recruiter.avatar_url || ""),
    });
  }

  return unique.slice(0, 12);
});

function resolveMediaUrl(rawUrl) {
  if (!rawUrl) return "";
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  return `${fileStorageOrigin}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
}

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

async function fetchCompanies() {
  try {
    loading.value = true;
    const response = await getRecruitersGroupedByIndustry();
    groups.value = normalizeGroups(response?.data || response);
  } catch (error) {
    console.error("Failed to load companies:", error);
    groups.value = [];
  } finally {
    loading.value = false;
  }
}

function getInitials(name) {
  return String(name || "C")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function goToRecruiterProfile(company) {
  if (!company?.id) return;

  router.push({
    name: "public-recruiter-profile",
    params: {
      id: company.id,
    },
  });
}

onMounted(fetchCompanies);
</script>
