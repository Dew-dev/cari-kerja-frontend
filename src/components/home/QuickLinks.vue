<template>
  <section class="bg-white py-12 px-4">
    <div class="max-w-290 mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div 
          @click="goToJobsByCategory"
          class="bg-linear-to-br from-blue-50 to-blue-100 p-8 shadow-md rounded-xl hover:shadow-xl hover:from-blue-100 hover:to-blue-200 transition duration-300 ease-in-out cursor-pointer border border-blue-200"
        >
          <div class="text-blue-600 text-4xl mb-4"><span class="pi pi-book"></span></div>
          <div class="font-bold text-xl text-gray-800">{{ $t("jobsByCategory") }}</div>
          <p class="text-gray-600 text-sm mt-2">{{ $t('exploreByCategory') || 'Browse jobs by industry' }}</p>
        </div>

        <div 
          @click="goToAllJobs"
          class="bg-linear-to-br from-pink-50 to-pink-100 p-8 shadow-md rounded-xl hover:shadow-xl hover:from-pink-100 hover:to-pink-200 transition duration-300 ease-in-out cursor-pointer border border-pink-200"
        >
          <div class="text-pink-600 text-4xl mb-4"><span class="pi pi-briefcase"></span></div>
          <div class="font-bold text-xl text-gray-800">{{ $t("allJobs") }}</div>
          <p class="text-gray-600 text-sm mt-2">{{ $t('viewAllJobs') || 'See all available positions' }}</p>
        </div>

        <div 
          @click="goToJobsByCity"
          class="bg-linear-to-br from-green-50 to-green-100 p-8 shadow-md rounded-xl hover:shadow-xl hover:from-green-100 hover:to-green-200 transition duration-300 ease-in-out cursor-pointer border border-green-200"
        >
          <div class="text-green-600 text-4xl mb-4">
            <svg class="w-10 h-10 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div class="font-bold text-xl text-gray-800">{{ $t("jobsByCity") }}</div>
          <p class="text-gray-600 text-sm mt-2">{{ $t('exploreJobsByLocation') || 'Find jobs in your city' }}</p>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup>
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

const router = useRouter();
const { t } = useI18n();

const goToJobsByCategory = () => {
  router.push("/categories");
};

const goToAllJobs = () => {
  router.push("/jobposts");
};

const goToJobsByCity = () => {
  router.push("/cities");
};
</script>
