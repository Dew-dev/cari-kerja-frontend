<script setup>
import { useRouter } from "vue-router"
// import { useAuthStore } from "@/stores/auth.store"
// import ProfileAvatar from "@/components/common/ProfileAvatar.vue"

import { useI18n } from "vue-i18n"
import { computed } from "vue"
import { useAuthStore } from "../../stores/authStore"
// import ProfileAvatar from "@/components/common/ProfileAvatar.vue"
const { locale,t } = useI18n()
const router = useRouter()
const route = router.currentRoute
const auth = useAuthStore() 
// computed

const menu = computed(() => [
  { label: t("your") + " " + t("Profile"), path: `/recruiters/${auth.user?.id}` },
  { label: t("your") + " " + t("jobs"), path: "/recruiter/jobs" },
  { label: t("findWorkers"), path: "/recruiter/search-workers" },
  // { label: t("applicants"), path: "/recruiter/applicants" },
])

function isActive(path) {
  return route.path === path
}
</script>

<template>

    <nav class="ml-8 flex gap-6 text-sm">
      <!-- <span @click="router.push('/recruiter')" class="cursor-pointer text-lg font-semibold hover:scale-105 hover:text-pink-500 transition duration-200 ease-in-out">
        {{ t("dashboard") }}
      </span>
      <span @click="router.push('/recruiter/jobs')" class="cursor-pointer text-lg font-semibold hover:scale-105 hover:text-pink-500 transition duration-200 ease-in-out">
        {{ t("jobs") }}
      </span>
      <span
        @click="router.push('/recruiter/jobs/create')"
        class="cursor-pointer text-lg font-semibold hover:scale-105 hover:text-pink-500 transition duration-200 ease-in-out"
      >
        {{ t("createjob") }}
      </span> -->
      <span
        v-for="item in menu"
        :key="item.path"
        @click="router.push(item.path)"
        class="cursor-pointer pb-1"
        
        :class="
          isActive(item.path)
            ? 'text-white font-bold underline decoration-white/80 decoration-2 underline-offset-8'
            : 'cursor-pointer text-lg font-semibold hover:scale-105 hover:text-pink-500 transition duration-200 ease-in-out'
        "
      >
        {{ item.label }}
      </span>
    </nav>
</template>
