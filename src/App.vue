<script setup>
import HelloWorld from './components/HelloWorld.vue'
import AppFooter from './components/layout/AppFooter.vue';
import AppHeader from "./components/layout/AppHeader.vue";
import { useI18n } from "vue-i18n"
const { locale, t } = useI18n()
import 'primeicons/primeicons.css'
</script>

<template>
  <div class="min-h-screen bg-white text-gray-900">
    <AppHeader />
    <router-view :key="$route.fullPath"/>
    <AppFooter />
  </div>
</template>


<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
body{
  background: grey;
}
.hover-button:hover{
  scale: calc(1.05);
}
</style>
<script>
  
</script>
