<template>
  <header class="bg-[#0a9cf5] text-white">
    <div
      class="max-w-290 mx-auto px-4 sm:px-6 md:px-8 py-4 md:py-10 flex items-center justify-between"
    >
      <div
        class="text-lg md:text-xl font-bold hover:cursor-pointer hover:scale-110 transition duration-200 ease-in-out"
        @click="router.push('/')"
      >
        <span
          :class="
            route.path === '/'
              ? 'text-red-500'
              : 'text-white hover:text-pink-500'
          "
          >CARI </span
        >
        <span
          :class="
            route.path === '/'
              ? 'text-white hover:text-pink-500'
              : 'text-red-500'
          "
          >KERJA</span
        >
      </div>

      <!-- Desktop: recruiter/user header -->
      <div class="hidden md:block">
        <RecruiterHeader v-if="auth.role === 'recruiter'" />
        <UserHeader v-else />
      </div>

      <!-- Desktop nav -->
      <nav class="hidden md:flex items-center gap-4 text-sm relative">
        <!-- LANGUAGE DROPDOWN -->
        <div class="relative">
          <button
            @click="open = !open"
            class="flex items-center gap-1 border border-white shadow-sm px-4 py-3 rounded font-semibold hover:bg-white hover:text-blue-500 transition duration-200"
            aria-haspopup="true"
            :aria-expanded="open"
          >
            {{ locale.toUpperCase() }}
            <span>▾</span>
          </button>

          <div
            v-if="open"
            class="absolute right-0 mt-1 bg-white text-gray-800 shadow-lg min-w-[140px] z-50 font-semibold rounded-md"
          >
            <button
              v-for="lang in languages"
              :key="lang.code"
              @click="setLang(lang.code)"
              class="w-full text-left px-3 py-2 hover:bg-gray-100"
            >
              {{ lang.label }}
            </button>
          </div>
        </div>

        <!-- SIGN IN -->
        <template v-if="!auth.isLoggedIn">
          <button
            class="border border-white shadow-sm px-4 py-3 rounded font-semibold hover:bg-white hover:text-blue-500 transition duration-200"
            @click="router.push('/login')"
          >
            {{ $t("nav.signIn") }}
          </button>
        </template>

        <!-- AUTHENTICATED -->
        <template v-else>
          <div class="flex items-center gap-2 cursor-pointer" @click="goProfile">
            <div class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
              <img
                v-if="auth.user?.avatar_url"
                :src="`${fileStorageUrl}${auth.user?.avatar_url}`"
                class="w-full h-full object-cover"
              />
              <span v-else class="text-sm font-semibold text-gray-700">
                {{ auth.user?.name?.charAt(0)?.toUpperCase() }}
              </span>
            </div>
            <span class="text-sm">{{ auth.user?.name }}</span>
          </div>

          <button
            class="border border-white shadow-sm px-4 py-3 rounded hover:bg-white hover:text-blue-500 font-semibold transition duration-200"
            @click="logout"
          >
            Logout
          </button>
        </template>
      </nav>

      <!-- Mobile menu button -->
      <div class="md:hidden flex items-center gap-2">
        <button
          @click="mobileOpen = !mobileOpen"
          class="p-2 rounded-md border border-white hover:bg-white hover:text-blue-500 transition"
          aria-label="Toggle menu"
          :aria-expanded="mobileOpen"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              v-if="!mobileOpen"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
            <path
              v-else
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile panel -->
    <div
      v-if="mobileOpen"
      class="md:hidden bg-[#0a9cf5] text-white border-t border-blue-400"
    >
      <div class="max-w-290 mx-auto px-4 py-4 space-y-3">
        <!-- Language selector (mobile) -->
        <div>
          <div class="font-semibold mb-2">
            {{ $t("nav.language") || "Language" }}
          </div>
          <div class="flex gap-2">
            <button
              v-for="lang in languages"
              :key="lang.code + '-m'"
              @click="setLang(lang.code)"
              class="flex-1 text-sm text-left px-3 py-2 bg-white/10 rounded hover:bg-white/20"
            >
              {{ lang.label }}
            </button>
          </div>
        </div>

        <!-- Auth actions (mobile) -->
        <div>
          <template v-if="!auth.isLoggedIn">
            <button
              class="w-full text-left px-3 py-3 rounded bg-white/10 hover:bg-white/20 font-semibold"
              @click="router.push('/login')"
            >
              {{ $t("nav.signIn") }}
            </button>
          </template>

          <template v-else>
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden cursor-pointer" @click="goProfile">
                <img
                  v-if="auth.user?.avatar_url"
                  :src="`${fileStorageUrl}${auth.user?.avatar_url}`"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-sm font-semibold text-gray-700">
                  {{ auth.user?.name?.charAt(0)?.toUpperCase() }}
                </span>
              </div>
              <div class="flex-1">
                <div class="font-semibold">{{ auth.user?.name }}</div>
                <button
                  class="mt-2 block text-sm px-3 py-2 rounded bg-white/10 hover:bg-white/20 font-semibold"
                  @click="logout"
                >
                  Logout
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import RecruiterHeader from "@/components/layout/RecruiterHeader.vue";
import UserHeader from "@/components/layout/UserHeader.vue";

const { locale } = useI18n();
const open = ref(false);
const mobileOpen = ref(false);

import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore.js";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const fileStorageUrl = import.meta.env.VITE_FILE_STORAGE_URL;

function logout() {
  auth.logout();
  mobileOpen.value = false;
  open.value = false;
  router.push("/");
}

function goProfile() {
  if (auth.role === "recruiter") {
    router.push("/recruiter/profile/edit");
  } else {
    router.push("/profile/edit");
  }
}

const languages = [
  { code: "en", label: "English" },
  { code: "id", label: "Indonesia" },
  // { code: "ru", label: "Русский" },
  // { code: "uz", label: "O'zbekcha" },
];

function setLang(lang) {
  locale.value = lang;
  localStorage.setItem("lang", lang);
  open.value = false;
  mobileOpen.value = false;
}
</script>
