<script setup>
import { useI18n } from "vue-i18n"

const { locale } = useI18n()

const languages = [
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
  { code: "uz", label: "UZ" },
]

function setLang(code) {
  locale.value = code
  localStorage.setItem("lang", code)
}
</script>

<template>
  <div class="flex items-center gap-2 text-sm">
    <button
      v-for="lang in languages"
      :key="lang.code"
      @click="setLang(lang.code)"
      class="px-2 py-1 rounded"
      :class="
        locale === lang.code
          ? 'bg-blue-600 text-white'
          : 'text-gray-500 hover:text-black'
      "
    >
      {{ lang.label }}
    </button>
  </div>
</template>
