<script setup>
import { useI18n } from "vue-i18n";
import { onMounted } from "vue";

const { t } = useI18n();

onMounted(() => {
  document.title = "cari-kerja.id - " + t("notFound.pageTitle");
});
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center bg-radial from-blue-50/50 via-white to-white px-4 py-16 sm:px-6 lg:px-8">
    <div class="relative max-w-lg w-full text-center">
      <!-- Decorative background elements -->
      <div class="absolute -top-12 -left-12 w-48 h-48 bg-blue-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob"></div>
      <div class="absolute -bottom-16 -right-16 w-48 h-48 bg-indigo-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000"></div>

      <!-- Main card -->
      <div class="relative bg-white/70 backdrop-blur-xl border border-gray-100/80 rounded-3xl p-8 sm:p-12 shadow-2xl transition-all duration-300 hover:shadow-indigo-100/80">
        
        <!-- Animated 404 Illustration -->
        <div class="flex justify-center mb-8">
          <div class="relative">
            <!-- Outer pulse circle -->
            <div class="absolute inset-0 rounded-full bg-blue-100/50 animate-ping opacity-75"></div>
            <!-- Inner container with graphic -->
            <div class="relative w-28 h-28 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl">
              <i class="pi pi-search text-4xl animate-bounce"></i>
            </div>
            <!-- Decorative badge -->
            <span class="absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-sm shadow-md animate-pulse">
              !
            </span>
          </div>
        </div>

        <!-- Typography -->
        <h1 class="text-7xl sm:text-8xl font-black bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight mb-2 select-none">
          {{ $t('notFound.title') }}
        </h1>
        
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          {{ $t('notFound.subtitle') }}
        </h2>
        
        <p class="text-base text-gray-600 leading-relaxed mb-8 max-w-md mx-auto">
          {{ $t('notFound.description') }}
        </p>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <router-link
            to="/"
            class="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg hover:shadow-indigo-500/30 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <i class="pi pi-home mr-2 text-sm"></i>
            {{ $t('notFound.backHome') }}
          </router-link>
          
          <router-link
            to="/jobposts"
            class="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-gray-200 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <i class="pi pi-briefcase mr-2 text-sm text-gray-400"></i>
            {{ $t('notFound.findJobs') }}
          </router-link>
        </div>

      </div>

      <!-- Subtle Footer / Help text -->
      <div class="mt-8 text-sm text-gray-500">
        {{ $t('footer.allRightsReserved') || '© 2026 cari-kerja.id' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.95);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}
</style>
