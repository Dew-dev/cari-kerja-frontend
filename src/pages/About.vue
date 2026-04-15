<script setup>
import { useI18n } from "vue-i18n";
import { onMounted } from "vue";

const { t } = useI18n();

onMounted(() => {
  document.title = "cari-kerja.id - " + t("about.pageTitle");
});
</script>

<template>
  <div class="bg-white">
    <!-- Hero -->
    <section class="bg-linear-to-r from-blue-50 to-white py-12">
      <div class="max-w-290 mx-auto px-4">
        <div class="grid gap-6 md:grid-cols-2 items-center">
          <div>
            <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {{ $t("about.title") }}
            </h1>
            <p class="text-gray-700 mb-4">
              {{ $t("about.heroDescription") }}
            </p>

            <div class="flex flex-wrap gap-3">
              <a
                href="#mission"
                class="px-4 py-2 bg-blue-600 text-white rounded hover:opacity-90"
                >{{ $t("about.ourMission") }}</a
              >
              <a
                href="#history"
                class="px-4 py-2 border border-gray-200 rounded hover:bg-gray-50"
                >{{ $t("about.history") }}</a
              >
            </div>
          </div>

          <div class="hidden md:block">
            <img src="/vite.svg" alt="about" class="w-full max-w-sm mx-auto" />
          </div>
        </div>
      </div>
    </section>

    <!-- Mission -->
    <section id="mission" class="py-12">
      <div class="max-w-290 mx-auto px-4">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-2xl font-semibold mb-3">{{ $t("about.missionTitle") }}</h2>
          <p class="text-gray-700 mb-4">
            {{ $t("about.missionDescription") }}
          </p>
          <p class="text-gray-700 mb-4">
            {{ $t("about.missionDetails") }}
          </p>
        </div>
      </div>
    </section>

    <!-- History / Timeline -->
    <section id="history" class="py-12 bg-gray-50">
      <div class="max-w-290 mx-auto px-4">
        <h2 class="text-2xl font-semibold mb-6">{{ $t("about.ourStory") }}</h2>

        <div class="space-y-6">
          <div class="flex gap-4 items-start">
            <div
              class="shrink-0 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold"
            >
              2024
            </div>
            <div>
              <h3 class="font-semibold">{{ $t("about.launched") }}</h3>
              <p class="text-gray-600">
                {{ $t("about.launchedDescription") }}
              </p>
            </div>
          </div>

          <div class="flex gap-4 items-start">
            <div
              class="shrink-0 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold"
            >
              2025
            </div>
            <div>
              <h3 class="font-semibold">{{ $t("about.expansion") }}</h3>
              <p class="text-gray-600">
                {{ $t("about.expansionDescription") }}
              </p>
            </div>
          </div>

          <div class="flex gap-4 items-start">
            <div
              class="shrink-0 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold"
            >
              2026
            </div>
            <div>
              <h3 class="font-semibold">{{ $t("about.future") }}</h3>
              <p class="text-gray-600">
                {{ $t("about.futureDescription") }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Team / Contact -->
    <section class="py-12">
      <div class="max-w-290 mx-auto px-4">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-2xl font-semibold mb-4">{{ $t("about.getInTouch") }}</h2>
          <p class="text-gray-700 mb-6">
            {{ $t("about.contactDescription") }}
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 class="font-semibold">{{ $t("about.headOffice") }}</h4>
              <p class="text-gray-600">{{ $t("about.location") }}</p>
              <p class="text-gray-600 mt-2">
                {{ $t("about.email") }}:
                <a
                  href="mailto:info@cari-kerja.id"
                  class="text-blue-600 hover:underline"
                  >info@cari-kerja.id</a
                >
              </p>
            </div>

            <div>
              <h4 class="font-semibold">{{ $t("about.careers") }}</h4>
              <p class="text-gray-600">
                {{ $t("about.careersDescription") }}
                <a
                  href="mailto:careers@cari-kerja.id"
                  class="text-blue-600 hover:underline"
                  >careers@cari-kerja.id</a
                >
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-12 bg-blue-600 text-white">
      <div class="max-w-290 mx-auto px-4 text-center">
        <h3 class="text-xl font-semibold mb-3">
          {{ $t("about.ctaTitle") }}
        </h3>
        <div class="flex justify-center gap-3">
          <router-link
            to="/jobposts"
            class="px-4 py-2 bg-white text-blue-600 rounded font-semibold"
            >{{ $t("about.searchJobs") }}</router-link
          >
          <router-link
            to="/register-recruiter"
            class="px-4 py-2 border border-white rounded"
            >{{ $t("about.forEmployers") }}</router-link
          >
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>

:global(html) {
  scroll-behavior: smooth;
}

footer{
  display: none;
}
</style>
