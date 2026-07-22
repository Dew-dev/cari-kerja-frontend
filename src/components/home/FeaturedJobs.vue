<template>
  <section class="bg-white px-4 py-12">
    <div class="max-w-290 mx-auto">
      <div class="mb-12">
        <h2 class="text-3xl font-bold text-gray-800 mb-2">{{ $t('featuredJobs') || 'Featured Jobs' }}</h2>
        <p class="text-gray-600">{{ $t('bestJobsAvailable') || 'Check out the best job opportunities' }}</p>
      </div>

      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600">{{ $t('loading') || 'Loading...' }}</p>
      </div>

      <div v-else-if="jobs.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="job in jobs"
          :key="job.id"
          @click="goToJobDetail(job.id)"
          class="bg-gray-50 rounded-xl p-6 hover:shadow-lg hover:bg-blue-50 transition duration-300 cursor-pointer border border-gray-200 hover:border-blue-300"
        >
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-lg font-bold text-gray-800">{{ job.title }}</h3>
              <p class="text-sm text-gray-600">{{ job.company_name }}</p>
            </div>
            <span class="bg-pink-100 text-pink-700 text-xs font-semibold px-3 py-1 rounded">{{ job.job_type }}</span>
          </div>

          <div class="space-y-2 mb-4">
            <div class="flex items-center text-sm text-gray-600">
              <span class="pi pi-map-marker text-pink-600 mr-2"></span>
              {{ job.location || 'Not specified' }}
            </div>
            <div class="flex items-center text-sm text-gray-600">
              <span class="pi pi-dollar text-green-600 mr-2"></span>
              {{ job.salary_min ? `${job.salary_min} - ${job.salary_max} ${job.currency || ''}` : 'Negotiable' }}
            </div>
          </div>

          <p class="text-sm text-gray-600 line-clamp-2 mb-4">{{ job.description }}</p>

          <div class="flex gap-2 flex-wrap">
            <span v-for="(skill, idx) in (job.skills || []).slice(0, 2)" :key="idx" class="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
              {{ skill.skill_name }}
            </span>
            <span v-if="(job.skills || []).length > 2" class="text-gray-500 text-xs px-2 py-1">+{{ (job.skills || []).length - 2 }}</span>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-12">
        <p class="text-gray-600 mb-4">{{ $t('noJobsAvailable') || 'No jobs available at the moment' }}</p>
        <button
          @click="$router.push('/jobposts')"
          class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition"
        >
          {{ $t('browseAllJobs') || 'Browse All Jobs' }}
        </button>
      </div>

      <div class="text-center mt-12">
        <button
          @click="$router.push('/jobposts')"
          class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition"
        >
          {{ $t('seeAllJobs') || 'See All Jobs' }} →
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getJobPosts } from '@/services/jobposts.api';

const router = useRouter();
const jobs = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const response = await getJobPosts({ limit: 6, page: 1 });
    jobs.value = response.data.data || [];
  } catch (error) {
    console.error('Error loading featured jobs:', error);
  } finally {
    loading.value = false;
  }
});

function goToJobDetail(jobId) {
  router.push({
    name: 'JobDetail',
    params: { id: jobId }
  });
}
</script>
