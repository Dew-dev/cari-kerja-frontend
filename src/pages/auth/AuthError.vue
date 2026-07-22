<script setup>
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

onMounted(() => {
  document.title = "cari-kerja.id - " + t("authError.pageTitle");
});
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-red-50/50 via-white to-white px-4 py-16 sm:px-6 lg:px-8">
    <div class="relative max-w-lg w-full text-center">
      <div class="relative bg-white/70 backdrop-blur-xl border border-gray-100/80 rounded-3xl p-8 sm:p-12 shadow-2xl">
        <div class="flex justify-center mb-8">
          <div class="relative w-28 h-28 rounded-full bg-gradient-to-tr from-red-500 to-rose-600 flex items-center justify-center text-white shadow-xl">
            <i class="pi pi-exclamation-triangle text-4xl"></i>
          </div>
        </div>

        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          {{ $t('authError.title') }}
        </h1>

        <p class="text-base text-gray-600 leading-relaxed mb-8 max-w-md mx-auto">
          {{ $t('authError.description') }}
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <router-link
            to="/login"
            class="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all duration-200"
          >
            <i class="pi pi-sign-in mr-2 text-sm"></i>
            {{ $t('authError.backToLogin') }}
          </router-link>

          <router-link
            to="/"
            class="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-gray-200 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-all duration-200"
          >
            <i class="pi pi-home mr-2 text-sm text-gray-400"></i>
            {{ $t('authError.backHome') }}
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
