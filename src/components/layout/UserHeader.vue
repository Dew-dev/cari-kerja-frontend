<script setup>
import { useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import { computed } from "vue"
// import { useAuthStore } from "@/stores/auth.store"
// import ProfileAvatar from "@/components/common/ProfileAvatar.vue"
const { locale,t } = useI18n()
// computed
const router = useRouter()
// const auth = useAuthStore()
// const router = useRouter()
const route = router.currentRoute
// const auth = useAuthStore() 
// computed

const menu = computed(() => [
  { label: t("jobs"), path: "/jobposts" },
  { label: t("companies"), path: "/companies" },
  { label: t("salary"), path: "/salary" },
])

function isActive(path) {
  return route.path === path
}
</script>

<template>
    <nav class="ml-10 flex gap-6 text-sm">
      <!-- <router-link to="/jobposts" class="cursor-pointer text-lg font-semibold hover:scale-105 hover:text-pink-500 transition duration-200 ease-in-out">
        {{ t("jobs") }}
      </router-link>
      <router-link to="/companies" class="cursor-pointer text-lg font-semibold hover:scale-105 hover:text-pink-500 transition duration-200 ease-in-out">{{ t("companies") }}</router-link>
      <router-link to="/salary" class="cursor-pointer text-lg font-semibold hover:scale-105 hover:text-pink-500 transition duration-200 ease-in-out">{{ t("salary") }}</router-link> -->
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
