<template>
  <section class="bg-white py-12">
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
          @click="goToLatestJobs"
          class="bg-linear-to-br from-green-50 to-green-100 p-8 shadow-md rounded-xl hover:shadow-xl hover:from-green-100 hover:to-green-200 transition duration-300 ease-in-out cursor-pointer border border-green-200"
        >
          <div class="text-green-600 text-4xl mb-4"><span class="pi pi-clock"></span></div>
          <div class="font-bold text-xl text-gray-800">{{ $t("latestJobs") }}</div>
          <p class="text-gray-600 text-sm mt-2">{{ $t('newListings') || 'Recently posted jobs' }}</p>
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

const goToLatestJobs = () => {
  router.push({
    path: "/jobposts",
    query: { sort_by: "latest" }
  });
};
</script>
