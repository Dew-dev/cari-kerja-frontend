<script setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "@/stores/authStore.js";
const auth = useAuthStore();

const { locale, t } = useI18n();
const open = ref(false);

const languages = [
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
  { code: "uz", label: "O‘zbekcha" },
];

function setLang(lang) {
  locale.value = lang;
  localStorage.setItem("lang", lang);
  open.value = false;
}
</script>

<template>
  <footer class="shadow-sm bg-white text-sm text-gray-600">
    <div class="max-w-290 w-full mx-auto px-4 py-6 text-sm text-gray-600">
      <!-- TOP ROW -->
      <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
        <!-- LANGUAGE DROPDOWN -->
        <div class="relative">
          <button
            @click="open = !open"
            class="flex items-center gap-1 border border-gray-300 shadow-sm px-3 py-1 rounded text-gray-700"
          >
            {{ locale.toUpperCase() }}
            <span>▾</span>
          </button>

          <div
            v-if="open"
            class="absolute left-0 mt-1 bg-white shadow-lg rounded min-w-[140px] z-50"
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
        <!-- RIGHT SIDE -->
        <div class="flex items-center gap-3 flex-wrap">
          <!-- Employers -->
          <router-link
            to="/register-recruiter"
            v-if="!auth.isLoggedIn"
            class="border border-blue-500 text-blue-500 px-4 py-1 rounded"
          >
            {{ t("nav.forEmployers") }} →
          </router-link>
        </div>
      </div>

      <!-- LINKS -->
      <div class="flex flex-wrap items-center gap-4 mb-2">
        <a href="/contact" class="hover:underline">{{ t("footer.contact") }}</a>
        <a href="/about" class="hover:underline">{{ t("footer.about") }}</a>
        <a href="/faq" class="hover:underline">{{ t("footer.faq") }}</a>
        <a href="/terms-of-service" class="hover:underline">{{ t("footer.termsOfService") }}</a>
        <a href="/privacy-policy" class="hover:underline">{{ t("footer.privacyPolicy") }}</a>
      </div>

      <!-- COPYRIGHT -->
      <div class="text-gray-500 text-xs">
        © 2026 Cari Kerja. All rights reserved.
      </div>
    </div>
  </footer>
</template>
