<script setup>
import { ref } from "vue"
import { useI18n } from "vue-i18n"

const { locale, t } = useI18n()
const open = ref(false)

const languages = [
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
  { code: "uz", label: "O‘zbekcha" },
]

function setLang(lang) {
  locale.value = lang
  localStorage.setItem("lang", lang)
  open.value = false
}
</script>

<template>
  <footer class="border-t border-gray-200 bg-white text-sm text-gray-600">
    
    <div class="max-w-290 w-full mx-auto px-4 py-6 text-sm text-gray-600">

      <!-- TOP ROW -->
      <div class="flex flex-wrap items-center justify-between gap-4 mb-4">

        <!-- LANGUAGE DROPDOWN -->
        <div class="relative">
          <button
            @click="open = !open"
            class="flex items-center gap-1 border px-3 py-1 rounded text-gray-700"
          >
            {{ locale.toUpperCase() }}
            <span>▾</span>
          </button>

          <div
            v-if="open"
            class="absolute left-0 mt-1 bg-white border rounded shadow-sm min-w-[140px] z-50"
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
          <button class="border border-blue-500 text-blue-500 px-4 py-1 rounded">
            {{ t("nav.forEmployers") }} →
          </button>
        </div>
      </div>

      <!-- LINKS -->
      <div class="flex flex-wrap items-center gap-4 mb-2">
        <a href="#" class="hover:underline">{{ t("footer.resources") }}</a>
        <a href="#" class="hover:underline">{{ t("footer.contact") }}</a>
        <a href="#" class="hover:underline">{{ t("footer.about") }}</a>
        <a href="#" class="hover:underline">{{ t("footer.career") }}</a>
        <a href="#" class="hover:underline">{{ t("footer.news") }}</a>
        <a href="#" class="hover:underline">{{ t("footer.help") }}</a>
        <a href="#" class="hover:underline">{{ t("footer.terms") }}</a>
      </div>

      <!-- COPYRIGHT -->
      <div class="text-gray-500 text-xs">
        © 2006–2026 Jobs.uz. Uzbekistan's #1 job service.
      </div>

    </div>
  </footer>
</template>
