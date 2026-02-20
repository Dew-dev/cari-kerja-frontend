<template>
  <HeroSearch @search="handleSearch" />
  <QuickLinks />
  <FeaturedJobs />
  <!-- <CompanyLogos /> -->
</template>

<script setup>
import { useRouter } from "vue-router";
import HeroSearch from "../components/home/HeroSearch.vue";
import QuickLinks from "../components/home/QuickLinks.vue";
import FeaturedJobs from "../components/home/FeaturedJobs.vue";
import CompanyLogos from "../components/home/CompanyLogos.vue";

const router = useRouter();

function handleSearch(keyword, location) {
  const query = { page: 1 };

  if (keyword && keyword.trim()) {
    query.search = keyword.trim();
  }

  if (location) {
    query.province_name = location.name;
  }

  router.push({ path: "/jobposts", query });
}

function mounted() {
  document.title = "Job Portal - Home";
}
mounted();
</script>