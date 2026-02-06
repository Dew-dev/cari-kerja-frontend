<template>
  <div class="bg-white">
    <!-- Hero -->
    <section class="py-12 bg-linear-to-r from-blue-50 to-white">
      <div class="max-w-290 mx-auto px-4">
        <div class="max-w-3xl">
          <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {{ t("help.pricing.heroTitle") }}
          </h1>
          <p class="text-gray-700 text-lg">
            {{ t("help.pricing.heroSubtitle") }}
          </p>
        </div>
      </div>
    </section>

    <!-- Table of Contents -->
    <section class="py-10 border-b">
      <div class="max-w-290 mx-auto px-4">
        <h2 class="text-2xl font-semibold mb-6">{{ t("help.common.quickNav") }}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            v-for="item in tableOfContents"
            :key="item.id"
            @click="scrollToSection(item.id)"
            class="p-4 border rounded text-left hover:bg-blue-50 transition"
          >
            <h3 class="font-semibold text-blue-600">{{ item.title }}</h3>
            <p class="text-sm text-gray-600 mt-1">{{ item.description }}</p>
          </button>
        </div>
      </div>
    </section>

    <!-- Content Sections -->
    <section class="py-12">
      <div class="max-w-290 mx-auto px-4">
        <div class="space-y-12">
          <div :id="'section-1'" class="scroll-mt-20">
            <h2 class="text-3xl font-bold mb-4 text-gray-900">
              {{ t("help.pricing.sections.plans.title") }}
            </h2>
            <div class="bg-blue-50 p-6 rounded-lg text-gray-700">
              {{ t("help.pricing.sections.plans.body") }}
            </div>
          </div>

          <div :id="'section-2'" class="scroll-mt-20">
            <h2 class="text-3xl font-bold mb-4 text-gray-900">
              {{ t("help.pricing.sections.credits.title") }}
            </h2>
            <div class="bg-green-50 p-6 rounded-lg text-gray-700">
              {{ t("help.pricing.sections.credits.body") }}
            </div>
          </div>

          <div :id="'section-3'" class="scroll-mt-20">
            <h2 class="text-3xl font-bold mb-4 text-gray-900">
              {{ t("help.pricing.sections.team.title") }}
            </h2>
            <div class="bg-yellow-50 p-6 rounded-lg text-gray-700">
              {{ t("help.pricing.sections.team.body") }}
            </div>
          </div>

          <div :id="'section-4'" class="scroll-mt-20">
            <h2 class="text-3xl font-bold mb-4 text-gray-900">
              {{ t("help.pricing.sections.billing.title") }}
            </h2>
            <div class="bg-purple-50 p-6 rounded-lg text-gray-700">
              {{ t("help.pricing.sections.billing.body") }}
            </div>
          </div>

          <div :id="'section-5'" class="scroll-mt-20">
            <h2 class="text-3xl font-bold mb-4 text-gray-900">
              {{ t("help.pricing.sections.trials.title") }}
            </h2>
            <div class="bg-indigo-50 p-6 rounded-lg text-gray-700">
              {{ t("help.pricing.sections.trials.body") }}
            </div>
          </div>

          <div :id="'section-6'" class="scroll-mt-20">
            <h2 class="text-3xl font-bold mb-4 text-gray-900">
              {{ t("help.pricing.sections.custom.title") }}
            </h2>
            <div class="bg-red-50 p-6 rounded-lg text-gray-700">
              {{ t("help.pricing.sections.custom.body") }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-12 bg-blue-600 text-white">
      <div class="max-w-290 mx-auto px-4 text-center">
        <h2 class="text-2xl font-semibold mb-4">{{ t("help.pricing.cta.title") }}</h2>
        <p class="mb-6 text-blue-100">{{ t("help.pricing.cta.subtitle") }}</p>
        <router-link
          to="/contact"
          class="inline-block px-6 py-3 bg-white text-blue-600 rounded font-semibold hover:bg-gray-100"
        >
          {{ t("help.pricing.cta.button") }}
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();

const tableOfContents = computed(() => [
  { id: "section-1", title: t("help.pricing.toc.plans.title"), description: t("help.pricing.toc.plans.desc") },
  { id: "section-2", title: t("help.pricing.toc.credits.title"), description: t("help.pricing.toc.credits.desc") },
  { id: "section-3", title: t("help.pricing.toc.team.title"), description: t("help.pricing.toc.team.desc") },
  { id: "section-4", title: t("help.pricing.toc.billing.title"), description: t("help.pricing.toc.billing.desc") },
  { id: "section-5", title: t("help.pricing.toc.trials.title"), description: t("help.pricing.toc.trials.desc") },
  { id: "section-6", title: t("help.pricing.toc.custom.title"), description: t("help.pricing.toc.custom.desc") },
]);

function scrollToSection(sectionId) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
}

onMounted(() => {
  document.title = t("help.pricing.pageTitle");
});

watch(locale, () => {
  document.title = t("help.pricing.pageTitle");
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

.scroll-mt-20 {
  scroll-margin-top: 80px;
}
</style>
