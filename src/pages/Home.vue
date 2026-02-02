<template>
  <HeroSearch @search="handleSearch" />
  <QuickLinks />
  <CompanyLogos />
</template>

<script setup>
import { useRouter } from "vue-router";
import HeroSearch from "../components/home/HeroSearch.vue";
import QuickLinks from "../components/home/QuickLinks.vue";
import CompanyLogos from "../components/home/CompanyLogos.vue";

const router = useRouter();

function handleSearch(value) {
  const keyword = value?.trim();
  const query = { page: 1 };

  if (keyword) {
    query.search = keyword;
  }

  router.push({ path: "/jobposts", query });
}

function mounted() {
  document.title = "Job Portal - Home";
}
mounted();
</script>