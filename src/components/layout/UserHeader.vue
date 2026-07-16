<script setup>
import { useRouter, useRoute } from "vue-router"
import { useI18n } from "vue-i18n"
import { computed } from "vue"
const { locale,t } = useI18n()
const router = useRouter()
const route = useRoute()

const menu = computed(() => [
  { label: t("jobs"), path: "/jobposts" },
  { label: t("categories"), path: "/categories" },
  { label: t("chat.title"), path: "/chat" },
  { label: t("Profile"), path: "/profile/edit" },
])

function isActive(path) {
  return route.path === path || route.path.startsWith(path + '/')
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
            ? 'text-pink-500 text-lg font-bold scale-105'
            : 'cursor-pointer text-lg font-semibold hover:scale-105 hover:text-pink-500 transition duration-200 ease-in-out'
        "
      >
        {{ item.label }}
      </span>
    </nav>
</template>
