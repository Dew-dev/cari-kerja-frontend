<script setup>
import { useRouter } from "vue-router"
// import { useAuthStore } from "@/stores/auth.store"
// import ProfileAvatar from "@/components/common/ProfileAvatar.vue"

import { useI18n } from "vue-i18n"
import { computed } from "vue"
// import { useAuthStore } from "@/stores/auth.store"
// import ProfileAvatar from "@/components/common/ProfileAvatar.vue"
const { locale,t } = useI18n()
const router = useRouter()
const route = router.currentRoute
// const auth = useAuthStore() 
// computed

const menu = computed(() => [
  { label: t("dashboard"), path: "/recruiter" },
  { label: t("jobs"), path: "/recruiter/jobs" },
  { label: t("createjob"), path: "/recruiter/jobs/create" },
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
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'cursor-pointer text-lg font-semibold hover:scale-105 hover:text-pink-500 transition duration-200 ease-in-out'
        "
      >
        {{ item.label }}
      </span>
    </nav>
</template>
