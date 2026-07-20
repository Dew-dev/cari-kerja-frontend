<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { getHotJobPosts } from "@/services/jobposts.api";

const router = useRouter();
const { t } = useI18n();

const jobs = ref([]);
const loading = ref(true);

const fileStorageUrl = import.meta.env.VITE_FILE_STORAGE_URL || "";

onMounted(async () => {
  try {
    const res = await getHotJobPosts({ limit: 50, page: 1 });
    jobs.value = res.data?.data || [];
  } catch (err) {
    console.error("Failed to load hot jobs", err);
  } finally {
    loading.value = false;
  }
});

function viewJobDetail(id) {
  router.push(`/jobposts/${id}`);
}

function formatNumber(n) {
  if (!n) return "0";
  return new Intl.NumberFormat("id-ID").format(n);
}

function timeAgo(date) {
  if (!date) return "";
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return `${interval}y ago`;
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return `${interval}mo ago`;
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return `${interval}d ago`;
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return `${interval}h ago`;
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return `${interval}m ago`;
  return "just now";
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-10 px-4">
    <div class="max-w-4xl mx-auto">
      
      <!-- Back Button -->
      <button
        @click="router.back()"
        class="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm mb-6 transition-colors group"
      >
        <i class="pi pi-arrow-left text-xs group-hover:-translate-x-1 transition-transform"></i>
        Kembali ke Lowongan Kerja
      </button>

      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
          <span class="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-500 shadow-xs">
            🔥
          </span>
          Lowongan Terhangat (HOT Jobs)
        </h1>
        <p class="text-gray-500 text-sm mt-2">Daftar lowongan kerja dengan prioritas utama yang aktif dibuka oleh perusahaan.</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-20">
        <div class="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="jobs.length === 0" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <div class="text-4xl mb-4">📢</div>
        <h3 class="text-lg font-bold text-gray-800">Belum ada HOT Jobs saat ini</h3>
        <p class="text-gray-500 text-sm mt-1">Kembali lagi nanti untuk melihat lowongan prioritas terbaru.</p>
      </div>

      <!-- Job List -->
      <div v-else class="space-y-6">
        <div
          v-for="job in jobs"
          :key="job.id"
          class="bg-gradient-to-br from-amber-50/70 to-orange-50/40 border-2 border-orange-200 rounded-2xl shadow-xs hover:shadow-orange-200/50 hover:shadow-md transition-all duration-200 p-5 md:p-6 cursor-pointer"
          @click="viewJobDetail(job.id)"
        >
          <div class="flex flex-col md:flex-row gap-4 items-start md:items-center">
            
            <!-- Company Logo -->
            <div class="w-16 h-16 bg-white border border-gray-150 rounded-xl flex items-center justify-center p-2 flex-shrink-0 shadow-2xs">
              <img
                :src="job.avatar_url ? fileStorageUrl + job.avatar_url : '/company-default-image.png'"
                @error="(e) => (e.target.src = '/company-default-image.png')"
                :alt="job.company_name"
                class="max-w-full max-h-full object-contain"
              />
            </div>

            <!-- Job details -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <h3 class="text-lg font-bold text-gray-900 leading-snug">{{ job.title }}</h3>
                <span class="px-2 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-extrabold rounded-full shadow-xs flex items-center gap-0.5">
                  <i class="pi pi-star-fill text-[8px]"></i> HOT
                </span>
              </div>
              
              <div class="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                <span class="flex items-center gap-1"><i class="pi pi-building text-xs"></i> {{ job.company_name }}</span>
                <span class="flex items-center gap-1"><i class="pi pi-map-marker text-xs"></i> {{ job.location }}</span>
              </div>
            </div>

            <!-- Salary & Stats -->
            <div class="md:text-right shrink-0">
              <div class="text-orange-600 font-extrabold text-base">
                {{ formatNumber(job.salary_min) }} - {{ formatNumber(job.salary_max) }}
              </div>
              <div class="text-gray-400 text-xs mt-1">
                {{ job.currency }} · {{ job.employment_type }} · {{ timeAgo(job.created_at) }}
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  </div>
</template>
