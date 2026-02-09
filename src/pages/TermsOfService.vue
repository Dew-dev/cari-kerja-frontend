<template>
  <div class="bg-white">
    <!-- Hero -->
    <section class="py-12 bg-linear-to-r from-blue-50 to-white">
      <div class="max-w-290 mx-auto px-4 sm:px-6">
        <div class="max-w-3xl">
          <h1 class="text-4xl font-bold text-gray-900 mb-4">{{ $t("termsPage.heroTitle") }}</h1>
          <p class="text-gray-600">{{ $t("termsPage.lastUpdated") }}</p>
        </div>
      </div>
    </section>

    <!-- Content -->
    <article class="py-12">
      <div class="max-w-290 mx-auto px-4 sm:px-6">
        <div class="max-w-3xl prose prose-lg">
          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">{{ $t("termsPage.sections.agreement.title") }}</h2>
          <p class="text-gray-700 mb-6">
            {{ $t("termsPage.sections.agreement.body") }}
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">{{ $t("termsPage.sections.license.title") }}</h2>
          <p class="text-gray-700 mb-4">
            {{ $t("termsPage.sections.license.body") }}
          </p>
          <ul class="list-disc list-inside text-gray-700 space-y-2 mb-6">
            <li>{{ $t("termsPage.sections.license.bullets.0") }}</li>
            <li>{{ $t("termsPage.sections.license.bullets.1") }}</li>
            <li>{{ $t("termsPage.sections.license.bullets.2") }}</li>
            <li>{{ $t("termsPage.sections.license.bullets.3") }}</li>
            <li>{{ $t("termsPage.sections.license.bullets.4") }}</li>
          </ul>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">{{ $t("termsPage.sections.disclaimer.title") }}</h2>
          <p class="text-gray-700 mb-6">
            {{ $t("termsPage.sections.disclaimer.body") }}
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">{{ $t("termsPage.sections.limitations.title") }}</h2>
          <p class="text-gray-700 mb-6">
            {{ $t("termsPage.sections.limitations.body") }}
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">{{ $t("termsPage.sections.accuracy.title") }}</h2>
          <p class="text-gray-700 mb-6">
            {{ $t("termsPage.sections.accuracy.body") }}
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">{{ $t("termsPage.sections.links.title") }}</h2>
          <p class="text-gray-700 mb-6">
            {{ $t("termsPage.sections.links.body") }}
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">{{ $t("termsPage.sections.modifications.title") }}</h2>
          <p class="text-gray-700 mb-6">
            {{ $t("termsPage.sections.modifications.body") }}
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">{{ $t("termsPage.sections.governing.title") }}</h2>
          <p class="text-gray-700 mb-6">
            {{ $t("termsPage.sections.governing.body") }}
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">{{ $t("termsPage.sections.accounts.title") }}</h2>
          <p class="text-gray-700 mb-6">
            {{ $t("termsPage.sections.accounts.body") }}
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">{{ $t("termsPage.sections.prohibited.title") }}</h2>
          <p class="text-gray-700 mb-4">
            {{ $t("termsPage.sections.prohibited.intro") }}
          </p>
          <ul class="list-disc list-inside text-gray-700 space-y-2 mb-6">
            <li>{{ $t("termsPage.sections.prohibited.bullets.0") }}</li>
            <li>{{ $t("termsPage.sections.prohibited.bullets.1") }}</li>
            <li>{{ $t("termsPage.sections.prohibited.bullets.2") }}</li>
            <li>{{ $t("termsPage.sections.prohibited.bullets.3") }}</li>
            <li>{{ $t("termsPage.sections.prohibited.bullets.4") }}</li>
          </ul>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">{{ $t("termsPage.sections.termination.title") }}</h2>
          <p class="text-gray-700 mb-6">
            {{ $t("termsPage.sections.termination.body") }}
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">{{ $t("termsPage.sections.contact.title") }}</h2>
          <p class="text-gray-700">
            {{ $t("termsPage.sections.contact.bodyPrefix") }}
            <a href="mailto:legal@jobs.uz" class="text-blue-600 hover:underline">legal@jobs.uz</a>
          </p>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

onMounted(() => {
  document.title = t("termsPage.pageTitle");
});
</script>

<style scoped>
.max-w-290 {
  max-width: 1100px;
}

.bg-linear-to-r {
  background-image: linear-gradient(
    90deg,
    rgba(59, 130, 246, 0.06),
    rgba(255, 255, 255, 0)
  );
}

.prose {
  color: #374151;
}

.prose h2 {
  color: #111827;
}

.prose a {
  color: #2563eb;
}

.prose a:hover {
  text-decoration: underline;
}
</style>
