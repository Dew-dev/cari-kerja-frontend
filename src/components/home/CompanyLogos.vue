<template>
  <section class="bg-gray-50 py-16 mb-20">
    <div class="max-w-290 mx-auto px-4">
      <h2 class="text-3xl font-bold text-center text-gray-800 mb-2">{{ $t("topCompanies") || "Top Companies" }}</h2>
      <p class="text-center text-gray-600 mb-12">{{ $t("companiesHiring") || "Companies actively hiring" }}</p>

      <div class="bg-white rounded-xl shadow-md p-8 overflow-hidden">
        <SkeletonLogoGrid v-if="loading" />

        <div v-else-if="previewCompanies.length" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 items-start">
          <button
            v-for="company in previewCompanies"
            :key="company.id"
            type="button"
            @click="goToRecruiterProfile(company)"
            class="text-center hover:opacity-90 transition duration-200 cursor-pointer group"
          >
            <div
              class="mb-3"
            >
              <CompanyLogo
                class="shadow-sm group-hover:border-blue-200 group-hover:shadow"
                size="fluid"
                :src="company.logo"
                :alt="company.name"
                fallback="initials"
              />
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
import CompanyLogo from "@/components/common/CompanyLogo.vue";
import SkeletonLogoGrid from "@/components/common/skeleton/SkeletonLogoGrid.vue";

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
    const companyId = recruiter.company_id || recruiter.id || recruiter.recruiter_id;
    if (!companyId || seen.has(companyId)) continue;
    seen.add(companyId);
    unique.push({
      id: companyId,
      companyId: recruiter.company_id || null,
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

function goToRecruiterProfile(company) {
  if (!company?.id) return;

  if (company.companyId) {
    router.push({
      name: "public-company-profile",
      params: { id: company.companyId },
    });
    return;
  }

  // Prefer companies route when directory already uses company ids
  router.push({
    name: "public-company-profile",
    params: { id: company.id },
  });
}

onMounted(fetchCompanies);
</script>
