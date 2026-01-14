<template>
  <header class="bg-[#0a9cf5] text-white">
    
    <div class="max-w-290 mx-auto h-14 flex items-center justify-between">

      <div class="text-xl font-bold">JOBS.UZ</div>

      <nav class="flex items-center gap-4 text-sm relative">

        <!-- LANGUAGE DROPDOWN -->
        <div class="relative">
          <button
            @click="open = !open"
            class="flex items-center gap-1 border border-white px-3 py-1 rounded"
          >
            {{ locale.toUpperCase() }}
            <span>▾</span>
          </button>

          <div
            v-if="open"
            class="absolute right-0 mt-1 bg-white text-gray-800 border rounded shadow-sm min-w-[140px] z-50"
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
        <button class="border border-white px-4 py-1 rounded">
          {{ $t("nav.signIn") }}
        </button>

      </nav>
    </div>
  </header>
</template>



        <!-- <button @click="setLang('en')">EN</button>
        <button @click="setLang('ru')">RU</button>
        <button @click="setLang('uz')">UZ</button> -->



<script setup>
import { ref } from "vue"
import { useI18n } from "vue-i18n"

const { locale } = useI18n()
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
