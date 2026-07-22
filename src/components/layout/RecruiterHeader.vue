<script setup>
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "@/stores/authStore.js";

const props = defineProps({
  mobile: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["navigate"]);

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const menu = computed(() => {
  if (auth.restrictedVerification) {
    return [
      {
        label: t("verification.kyc.navLabel"),
        path: "/recruiter/verification",
        icon: "shield",
      },
    ];
  }
  return [
    { label: t("Profile"), path: `/recruiters/${auth.user?.id}`, icon: "user" },
    { label: t("vacancies"), path: "/recruiter/jobs", icon: "briefcase" },
    { label: t("find"), path: "/search-workers", icon: "search" },
    { label: t("chat.title"), path: "/chat", icon: "chat" },
    {
      label: t("verification.kyc.navLabel"),
      path: "/recruiter/verification",
      icon: "shield",
    },
  ];
});

function isActive(path) {
  return route.path === path || route.path.startsWith(path + "/");
}

function go(path) {
  router.push(path);
  emit("navigate");
}
</script>

<template>
  <nav
    :class="
      mobile
        ? 'flex flex-col gap-1 w-full'
        : 'ml-8 flex gap-6 text-sm'
    "
  >
    <button
      v-for="item in menu"
      :key="item.path"
      type="button"
      class="text-left transition duration-200"
      :class="
        mobile
          ? [
              'flex items-center gap-3 px-3 py-3 rounded-xl font-semibold',
              isActive(item.path)
                ? 'bg-white text-[#0a9cf5] shadow-sm'
                : 'bg-white/10 hover:bg-white/20 text-white',
            ]
          : [
              'cursor-pointer pb-1 text-lg font-semibold',
              isActive(item.path)
                ? 'text-white font-bold underline decoration-white/80 decoration-2 underline-offset-8'
                : 'hover:scale-105 hover:text-pink-500',
            ]
      "
      @click="go(item.path)"
    >
      <span
        v-if="mobile"
        class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        :class="isActive(item.path) ? 'bg-blue-50' : 'bg-white/10'"
      >
        <svg v-if="item.icon === 'user'" class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <svg v-else-if="item.icon === 'briefcase'" class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <svg v-else-if="item.icon === 'search'" class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <svg v-else-if="item.icon === 'shield'" class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <svg v-else class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </span>
      <span>{{ item.label }}</span>
    </button>
  </nav>
</template>
