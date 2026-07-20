<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import AppFooter from "./components/layout/AppFooter.vue";
import AppHeader from "./components/layout/AppHeader.vue";
import NotificationChannelBanner from "./components/auth/NotificationChannelBanner.vue";
import { useI18n } from "vue-i18n";
import { Notivue, Notification } from "notivue";
import "primeicons/primeicons.css";

const { locale, t } = useI18n();
const route = useRoute();

const isChatRoute = computed(() => route.path.startsWith("/chat"));
</script>

<template>
  <div
    class="bg-white text-gray-900"
    :class="isChatRoute ? 'h-dvh flex flex-col overflow-hidden' : 'min-h-screen'"
  >
    <AppHeader class="shrink-0" />
    <div :class="isChatRoute ? 'flex-1 min-h-0 overflow-hidden' : ''">
      <router-view :key="$route.fullPath" />
    </div>
  <div class="min-h-screen bg-white text-gray-900">
    <AppHeader />
    <NotificationChannelBanner />
    <router-view :key="$route.fullPath" />
    <Notivue v-slot="item">
      <Notification :item="item" />
    </Notivue>
    <AppFooter v-if="!isChatRoute" />
  </div>
</template>
