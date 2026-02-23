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

      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="n in 6" :key="n" class="bg-white rounded-lg shadow p-6 animate-pulse">
          <div class="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>

      <div v-else-if="industryGroups.length">
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

      <div v-else class="bg-white rounded-lg shadow p-12 text-center text-gray-600">
        {{ $t("noCompaniesAvailable") || "No companies available" }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { getRecruitersGroupedByIndustry } from "../services/recruiters.api";

const router = useRouter();
const loading = ref(false);
const industryGroups = ref([]);
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

onMounted(fetchGroupedCompanies);
</script>
