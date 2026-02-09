<template>
  <div class="bg-white">
    <!-- Hero -->
    <section class="py-12 bg-linear-to-r from-blue-50 to-white">
      <div class="max-w-290 mx-auto px-4 sm:px-6">
        <div class="max-w-3xl">
          <h1 class="text-4xl font-bold text-gray-900 mb-4">
            {{ t("termsOfService.title") }}
          </h1>
          <p class="text-gray-600">{{ t("termsOfService.lastUpdated") }}</p>
        </div>
      </div>
    </section>

    <!-- Content -->
    <article class="py-12">
      <div class="max-w-290 mx-auto px-4 sm:px-6">
        <div class="max-w-3xl prose prose-lg">
          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">
            {{ t("termsOfService.agreement.title") }}
          </h2>
          <p class="text-gray-700 mb-6">
            {{ t("termsOfService.agreement.content") }}
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">
            {{ t("termsOfService.useLicense.title") }}
          </h2>
          <p class="text-gray-700 mb-4">
            {{ t("termsOfService.useLicense.content") }}
          </p>
          <ul class="list-disc list-inside text-gray-700 space-y-2 mb-6">
            <li v-for="(item, idx) in useLicenseProhibitions" :key="idx">
              {{ item }}
            </li>
          </ul>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">
            {{ t("termsOfService.disclaimer.title") }}
          </h2>
          <p class="text-gray-700 mb-6">
            {{ t("termsOfService.disclaimer.content") }}
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">
            {{ t("termsOfService.limitations.title") }}
          </h2>
          <p class="text-gray-700 mb-6">
            {{ t("termsOfService.limitations.content") }}
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">
            {{ t("termsOfService.accuracy.title") }}
          </h2>
          <p class="text-gray-700 mb-6">
            {{ t("termsOfService.accuracy.content") }}
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">
            {{ t("termsOfService.links.title") }}
          </h2>
          <p class="text-gray-700 mb-6">
            {{ t("termsOfService.links.content") }}
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">
            {{ t("termsOfService.modifications.title") }}
          </h2>
          <p class="text-gray-700 mb-6">
            {{ t("termsOfService.modifications.content") }}
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">
            {{ t("termsOfService.governingLaw.title") }}
          </h2>
          <p class="text-gray-700 mb-6">
            {{ t("termsOfService.governingLaw.content") }}
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">
            {{ t("termsOfService.userAccounts.title") }}
          </h2>
          <p class="text-gray-700 mb-6">
            {{ t("termsOfService.userAccounts.content") }}
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">
            {{ t("termsOfService.prohibitedConduct.title") }}
          </h2>
          <p class="text-gray-700 mb-4">
            {{ t("termsOfService.prohibitedConduct.content") }}
          </p>
          <ul class="list-disc list-inside text-gray-700 space-y-2 mb-6">
            <li v-for="(item, idx) in prohibitedConductItems" :key="idx">
              {{ item }}
            </li>
          </ul>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">
            {{ t("termsOfService.termination.title") }}
          </h2>
          <p class="text-gray-700 mb-6">
            {{ t("termsOfService.termination.content") }}
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">
            {{ t("termsOfService.contact.title") }}
          </h2>
          <p class="text-gray-700">
            {{ t("termsOfService.contact.content") }}
            <br />
            {{ t("termsOfService.contact.emailLabel") }}:
            <a
              :href="`mailto:${t('termsOfService.contact.email')}`"
              class="text-blue-600 hover:underline"
              >{{ t("termsOfService.contact.email") }}</a
            >
          </p>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup>
import { onMounted, watch, computed } from "vue";
import { useI18n } from "vue-i18n";

const { t, locale, getLocaleMessage } = useI18n();

onMounted(() => {
  document.title = t("termsOfService.title");
});

watch(
  () => t("termsOfService.title"),
  (val) => {
    document.title = val;
  },
  { immediate: true },
);

// get arrays directly from current locale messages to ensure they are actual arrays
const useLicenseProhibitions = computed(() => {
  const msg = getLocaleMessage(locale.value) || {};
  return msg?.termsOfService?.useLicense?.prohibitions ?? [];
});

const prohibitedConductItems = computed(() => {
  const msg = getLocaleMessage(locale.value) || {};
  return msg?.termsOfService?.prohibitedConduct?.items ?? [];
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
