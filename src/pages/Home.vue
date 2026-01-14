<template>
  <HeroSearch />
  <QuickLinks />
  <CompanyLogos />
</template>

<script setup>
import HeroSearch from "../components/home/HeroSearch.vue"
import QuickLinks from "../components/home/QuickLinks.vue"
import CompanyLogos from "../components/home/CompanyLogos.vue"

function mounted() {
  document.title = "Job Portal - Home"
}
mounted()
</script>