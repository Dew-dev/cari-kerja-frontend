<template>
  <div class="bg-white">
    <!-- Hero -->
    <section class="py-12 bg-linear-to-r from-blue-50 to-white">
      <div class="max-w-290 mx-auto px-4">
        <div class="max-w-3xl">
          <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {{ t("help.apply.heroTitle") }}
          </h1>
          <p class="text-gray-700 text-lg">
            {{ t("help.apply.heroSubtitle") }}
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
              {{ t("help.apply.sections.profile.title") }}
            </h2>
            <div class="space-y-6">
              <div class="bg-blue-50 p-6 rounded-lg">
                <h3 class="font-semibold text-lg mb-3">{{ t("help.apply.sections.profile.cardTitle") }}</h3>
                <ul class="space-y-2 text-gray-700">
                  <li>{{ t("help.apply.sections.profile.bullets.0") }}</li>
                  <li>{{ t("help.apply.sections.profile.bullets.1") }}</li>
                  <li>{{ t("help.apply.sections.profile.bullets.2") }}</li>
                  <li>{{ t("help.apply.sections.profile.bullets.3") }}</li>
                  <li>{{ t("help.apply.sections.profile.bullets.4") }}</li>
                  <li>{{ t("help.apply.sections.profile.bullets.5") }}</li>
                </ul>
              </div>
              <p class="text-gray-700">
                {{ t("help.apply.sections.profile.note") }}
              </p>
            </div>
          </div>

          <div :id="'section-2'" class="scroll-mt-20">
            <h2 class="text-3xl font-bold mb-4 text-gray-900">
              {{ t("help.apply.sections.resume.title") }}
            </h2>
            <div class="space-y-6">
              <div class="bg-green-50 p-6 rounded-lg">
                <h3 class="font-semibold text-lg mb-3">{{ t("help.apply.sections.resume.cardTitle") }}</h3>
                <ul class="space-y-2 text-gray-700">
                  <li>{{ t("help.apply.sections.resume.bullets.0") }}</li>
                  <li>{{ t("help.apply.sections.resume.bullets.1") }}</li>
                  <li>{{ t("help.apply.sections.resume.bullets.2") }}</li>
                  <li>{{ t("help.apply.sections.resume.bullets.3") }}</li>
                  <li>{{ t("help.apply.sections.resume.bullets.4") }}</li>
                  <li>{{ t("help.apply.sections.resume.bullets.5") }}</li>
                  <li>{{ t("help.apply.sections.resume.bullets.6") }}</li>
                </ul>
              </div>
              <div class="border-l-4 border-blue-600 pl-4">
                <p class="text-gray-700">
                  <strong>{{ t("help.apply.sections.resume.tipLabel") }}:</strong>
                  {{ t("help.apply.sections.resume.tipBody") }}
                </p>
              </div>
            </div>
          </div>

          <div :id="'section-3'" class="scroll-mt-20">
            <h2 class="text-3xl font-bold mb-4 text-gray-900">
              {{ t("help.apply.sections.search.title") }}
            </h2>
            <div class="space-y-6">
              <div class="bg-purple-50 p-6 rounded-lg">
                <h3 class="font-semibold text-lg mb-3">{{ t("help.apply.sections.search.cardTitle") }}</h3>
                <ul class="space-y-2 text-gray-700">
                  <li>{{ t("help.apply.sections.search.bullets.0") }}</li>
                  <li>{{ t("help.apply.sections.search.bullets.1") }}</li>
                  <li>{{ t("help.apply.sections.search.bullets.2") }}</li>
                  <li>{{ t("help.apply.sections.search.bullets.3") }}</li>
                  <li>{{ t("help.apply.sections.search.bullets.4") }}</li>
                  <li>{{ t("help.apply.sections.search.bullets.5") }}</li>
                </ul>
              </div>
              <p class="text-gray-700">
                {{ t("help.apply.sections.search.note") }}
              </p>
            </div>
          </div>

          <div :id="'section-4'" class="scroll-mt-20">
            <h2 class="text-3xl font-bold mb-4 text-gray-900">
              {{ t("help.apply.sections.apply.title") }}
            </h2>
            <div class="space-y-6">
              <div class="bg-yellow-50 p-6 rounded-lg">
                <h3 class="font-semibold text-lg mb-3">{{ t("help.apply.sections.apply.cardTitle") }}</h3>
                <ul class="space-y-2 text-gray-700">
                  <li>{{ t("help.apply.sections.apply.bullets.0") }}</li>
                  <li>{{ t("help.apply.sections.apply.bullets.1") }}</li>
                  <li>{{ t("help.apply.sections.apply.bullets.2") }}</li>
                  <li>{{ t("help.apply.sections.apply.bullets.3") }}</li>
                  <li>{{ t("help.apply.sections.apply.bullets.4") }}</li>
                  <li>{{ t("help.apply.sections.apply.bullets.5") }}</li>
                  <li>{{ t("help.apply.sections.apply.bullets.6") }}</li>
                </ul>
              </div>
              <div class="bg-white border-2 border-blue-200 p-6 rounded-lg">
                <h3 class="font-semibold mb-3">{{ t("help.apply.sections.apply.templateTitle") }}</h3>
                <pre class="text-sm bg-gray-50 p-4 rounded overflow-x-auto text-gray-700">{{ t("help.apply.sections.apply.templateBody") }}</pre>
              </div>
            </div>
          </div>

          <div :id="'section-5'" class="scroll-mt-20">
            <h2 class="text-3xl font-bold mb-4 text-gray-900">
              {{ t("help.apply.sections.followUp.title") }}
            </h2>
            <div class="space-y-6">
              <div class="bg-indigo-50 p-6 rounded-lg">
                <h3 class="font-semibold text-lg mb-3">{{ t("help.apply.sections.followUp.cardTitle") }}</h3>
                <ul class="space-y-2 text-gray-700">
                  <li>{{ t("help.apply.sections.followUp.bullets.0") }}</li>
                  <li>{{ t("help.apply.sections.followUp.bullets.1") }}</li>
                  <li>{{ t("help.apply.sections.followUp.bullets.2") }}</li>
                  <li>{{ t("help.apply.sections.followUp.bullets.3") }}</li>
                  <li>{{ t("help.apply.sections.followUp.bullets.4") }}</li>
                  <li>{{ t("help.apply.sections.followUp.bullets.5") }}</li>
                </ul>
              </div>
              <div class="border-l-4 border-green-600 pl-4">
                <p class="text-gray-700">
                  <strong>{{ t("help.apply.sections.followUp.tipLabel") }}:</strong>
                  {{ t("help.apply.sections.followUp.tipBody") }}
                </p>
              </div>
            </div>
          </div>

          <div :id="'section-6'" class="scroll-mt-20">
            <h2 class="text-3xl font-bold mb-4 text-gray-900">
              {{ t("help.apply.sections.mistakes.title") }}
            </h2>
            <div class="space-y-6">
              <div class="space-y-3">
                <div class="bg-red-50 p-4 rounded-lg border-l-4 border-red-600">
                  <h4 class="font-semibold text-red-900 mb-2">{{ t("help.apply.sections.mistakes.items.0.title") }}</h4>
                  <p class="text-gray-700 text-sm">{{ t("help.apply.sections.mistakes.items.0.body") }}</p>
                </div>
                <div class="bg-red-50 p-4 rounded-lg border-l-4 border-red-600">
                  <h4 class="font-semibold text-red-900 mb-2">{{ t("help.apply.sections.mistakes.items.1.title") }}</h4>
                  <p class="text-gray-700 text-sm">{{ t("help.apply.sections.mistakes.items.1.body") }}</p>
                </div>
                <div class="bg-red-50 p-4 rounded-lg border-l-4 border-red-600">
                  <h4 class="font-semibold text-red-900 mb-2">{{ t("help.apply.sections.mistakes.items.2.title") }}</h4>
                  <p class="text-gray-700 text-sm">{{ t("help.apply.sections.mistakes.items.2.body") }}</p>
                </div>
                <div class="bg-red-50 p-4 rounded-lg border-l-4 border-red-600">
                  <h4 class="font-semibold text-red-900 mb-2">{{ t("help.apply.sections.mistakes.items.3.title") }}</h4>
                  <p class="text-gray-700 text-sm">{{ t("help.apply.sections.mistakes.items.3.body") }}</p>
                </div>
                <div class="bg-red-50 p-4 rounded-lg border-l-4 border-red-600">
                  <h4 class="font-semibold text-red-900 mb-2">{{ t("help.apply.sections.mistakes.items.4.title") }}</h4>
                  <p class="text-gray-700 text-sm">{{ t("help.apply.sections.mistakes.items.4.body") }}</p>
                </div>
              </div>
            </div>
          </div>

          <div :id="'section-7'" class="scroll-mt-20">
            <h2 class="text-3xl font-bold mb-4 text-gray-900">
              {{ t("help.apply.sections.interview.title") }}
            </h2>
            <div class="space-y-6">
              <div class="bg-linear-to-r from-green-50 to-blue-50 p-6 rounded-lg">
                <h3 class="font-semibold text-lg mb-3">{{ t("help.apply.sections.interview.cardTitle") }}</h3>
                <ul class="space-y-2 text-gray-700">
                  <li>{{ t("help.apply.sections.interview.bullets.0") }}</li>
                  <li>{{ t("help.apply.sections.interview.bullets.1") }}</li>
                  <li>{{ t("help.apply.sections.interview.bullets.2") }}</li>
                  <li>{{ t("help.apply.sections.interview.bullets.3") }}</li>
                  <li>{{ t("help.apply.sections.interview.bullets.4") }}</li>
                  <li>{{ t("help.apply.sections.interview.bullets.5") }}</li>
                  <li>{{ t("help.apply.sections.interview.bullets.6") }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-12 bg-blue-600 text-white">
      <div class="max-w-290 mx-auto px-4 text-center">
        <h2 class="text-2xl font-semibold mb-4">{{ t("help.apply.cta.title") }}</h2>
        <p class="mb-6 text-blue-100">{{ t("help.apply.cta.subtitle") }}</p>
        <router-link
          to="/jobposts"
          class="inline-block px-6 py-3 bg-white text-blue-600 rounded font-semibold hover:bg-gray-100"
        >
          {{ t("help.apply.cta.button") }}
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
  { id: "section-1", title: t("help.apply.toc.profile.title"), description: t("help.apply.toc.profile.desc") },
  { id: "section-2", title: t("help.apply.toc.resume.title"), description: t("help.apply.toc.resume.desc") },
  { id: "section-3", title: t("help.apply.toc.search.title"), description: t("help.apply.toc.search.desc") },
  { id: "section-4", title: t("help.apply.toc.apply.title"), description: t("help.apply.toc.apply.desc") },
  { id: "section-5", title: t("help.apply.toc.followUp.title"), description: t("help.apply.toc.followUp.desc") },
  { id: "section-6", title: t("help.apply.toc.mistakes.title"), description: t("help.apply.toc.mistakes.desc") },
  { id: "section-7", title: t("help.apply.toc.interview.title"), description: t("help.apply.toc.interview.desc") },
]);

function scrollToSection(sectionId) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
}

onMounted(() => {
  document.title = t("help.apply.pageTitle");
});

watch(locale, () => {
  document.title = t("help.apply.pageTitle");
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
