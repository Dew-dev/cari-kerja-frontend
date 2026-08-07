<template>
  <HeroSearch @search="handleSearch" />
  <QuickLinks />
  <JobsNearYou />
  <CompanyLogos />
  <NewsHighlight />
</template>

<script setup>
import { useRouter } from "vue-router";
import HeroSearch from "../components/home/HeroSearch.vue";
import QuickLinks from "../components/home/QuickLinks.vue";
import JobsNearYou from "../components/home/JobsNearYou.vue";
import CompanyLogos from "../components/home/CompanyLogos.vue";
import NewsHighlight from "../components/home/NewsHighlight.vue";
import { usePreferredLocation } from "@/composables/usePreferredLocation";

const router = useRouter();
const { setPreferredLocation, clearPreferredLocation } = usePreferredLocation();

function handleSearch(keyword, location) {
  const query = { page: 1 };

  if (keyword && keyword.trim()) {
    query.search = keyword.trim();
  }

  if (location) {
    // HeroSearch now returns cities (with province_name)
    if (location.province_name || location.city) {
      query.cities_name = location.name || location.city;
      setPreferredLocation(location);
    } else {
      query.province_name = location.name;
    }
  } else {
    clearPreferredLocation();
  }

  router.push({ path: "/jobposts", query });
}

function mounted() {
  document.title = "Job Portal - Home";
}
mounted();
</script>
