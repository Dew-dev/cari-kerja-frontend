<template>
  <div class="bg-white">
    <!-- Hero -->
    <section class="py-12 bg-linear-to-r from-blue-50 to-white">
      <div class="max-w-290 mx-auto px-4">
        <div class="max-w-3xl">
          <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {{ t("help.postJob.heroTitle") }}
          </h1>
          <p class="text-gray-700 text-lg">
            {{ t("help.postJob.heroSubtitle") }}
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
              {{ t("help.postJob.sections.start.title") }}
            </h2>
            <div class="space-y-6">
              <div class="bg-blue-50 p-6 rounded-lg">
                <h3 class="font-semibold text-lg mb-3">{{ t("help.postJob.sections.start.cardTitle") }}</h3>
                <ul class="space-y-2 text-gray-700">
                  <li>{{ t("help.postJob.sections.start.bullets.0") }}</li>
                  <li>{{ t("help.postJob.sections.start.bullets.1") }}</li>
                  <li>{{ t("help.postJob.sections.start.bullets.2") }}</li>
                  <li>{{ t("help.postJob.sections.start.bullets.3") }}</li>
                  <li>{{ t("help.postJob.sections.start.bullets.4") }}</li>
                </ul>
              </div>
              <div class="border-l-4 border-blue-600 pl-4">
                <p class="text-gray-700">
                  <strong>{{ t("help.postJob.sections.start.tipLabel") }}:</strong>
                  {{ t("help.postJob.sections.start.tipBody") }}
                </p>
              </div>
            </div>
          </div>

          <div :id="'section-2'" class="scroll-mt-20">
            <h2 class="text-3xl font-bold mb-4 text-gray-900">
              {{ t("help.postJob.sections.description.title") }}
            </h2>
            <div class="space-y-6">
              <p class="text-gray-700">{{ t("help.postJob.sections.description.body") }}</p>
              <div class="bg-green-50 p-6 rounded-lg">
                <h3 class="font-semibold text-lg mb-3">Key Points:</h3>
                <ul class="space-y-2 text-gray-700">
                  <li v-for="(bullet, index) in 6" :key="index">
                    {{ t(`help.postJob.sections.description.bullets.${index}`) }}
                  </li>
                </ul>
              </div>
              <div class="bg-white border-2 border-blue-200 p-6 rounded-lg">
                <h3 class="font-semibold mb-3">{{ t("help.postJob.sections.description.template") }}</h3>
                <pre class="text-sm bg-gray-50 p-4 rounded overflow-x-auto text-gray-700">{{ t("help.postJob.sections.description.templateContent") }}</pre>
              </div>
            </div>
          </div>

          <div :id="'section-3'" class="scroll-mt-20">
            <h2 class="text-3xl font-bold mb-4 text-gray-900">
              {{ t("help.postJob.sections.details.title") }}
            </h2>
            <div class="space-y-6">
              <div class="bg-purple-50 p-6 rounded-lg">
                <h3 class="font-semibold text-lg mb-3">{{ t("help.postJob.sections.details.cardTitle") }}</h3>
                <ul class="space-y-2 text-gray-700">
                  <li>{{ t("help.postJob.sections.details.bullets.0") }}</li>
                  <li>{{ t("help.postJob.sections.details.bullets.1") }}</li>
                  <li>{{ t("help.postJob.sections.details.bullets.2") }}</li>
                  <li>{{ t("help.postJob.sections.details.bullets.3") }}</li>
                  <li>{{ t("help.postJob.sections.details.bullets.4") }}</li>
                  <li>{{ t("help.postJob.sections.details.bullets.5") }}</li>
                  <li>{{ t("help.postJob.sections.details.bullets.6") }}</li>
                </ul>
              </div>
              <div class="border-l-4 border-green-600 pl-4">
                <p class="text-gray-700">
                  <strong>{{ t("help.postJob.sections.details.tipLabel") }}:</strong>
                  {{ t("help.postJob.sections.details.tipBody") }}
                </p>
              </div>
            </div>
          </div>

          <div :id="'section-4'" class="scroll-mt-20">
            <h2 class="text-3xl font-bold mb-4 text-gray-900">
              {{ t("help.postJob.sections.skills.title") }}
            </h2>
            <div class="space-y-6">
              <p class="text-gray-700">{{ t("help.postJob.sections.skills.body") }}</p>
              <div class="bg-indigo-50 p-6 rounded-lg">
                <h3 class="font-semibold text-lg mb-3">Examples:</h3>
                <ul class="space-y-2 text-gray-700 list-disc list-inside">
                  <li v-for="(example, index) in 4" :key="index">
                    {{ t(`help.postJob.sections.skills.examples.${index}`) }}
                  </li>
                </ul>
              </div>
              <div class="border-l-4 border-indigo-600 pl-4">
                <p class="text-gray-700">
                  <strong>Note:</strong>
                  {{ t("help.postJob.sections.skills.note") }}
                </p>
              </div>
            </div>
          </div>

          <div :id="'section-5'" class="scroll-mt-20">
            <h2 class="text-3xl font-bold mb-4 text-gray-900">
              {{ t("help.postJob.sections.attract.title") }}
            </h2>
            <div class="space-y-6">
              <p class="text-gray-700">{{ t("help.postJob.sections.attract.body") }}</p>
              <div class="bg-linear-to-r from-pink-50 to-red-50 p-6 rounded-lg">
                <ul class="space-y-2 text-gray-700 list-disc list-inside">
                  <li v-for="(bullet, index) in 5" :key="index">
                    {{ t(`help.postJob.sections.attract.bullets.${index}`) }}
                  </li>
                </ul>
              </div>
              <div class="border-l-4 border-pink-600 pl-4">
                <p class="text-gray-700">
                  <strong>Tip:</strong>
                  {{ t("help.postJob.sections.attract.tip") }}
                </p>
              </div>
            </div>
          </div>

          <div :id="'section-6'" class="scroll-mt-20">
            <h2 class="text-3xl font-bold mb-4 text-gray-900">
              {{ t("help.postJob.sections.manage.title") }}
            </h2>
            <div class="space-y-6">
              <p class="text-gray-700">{{ t("help.postJob.sections.manage.body") }}</p>
              <div class="bg-teal-50 p-6 rounded-lg">
                <ol class="space-y-2 text-gray-700 list-decimal list-inside">
                  <li v-for="(step, index) in 7" :key="index">
                    {{ t(`help.postJob.sections.manage.steps.${index}`) }}
                  </li>
                </ol>
              </div>
              <div class="border-l-4 border-teal-600 pl-4">
                <p class="text-gray-700">
                  <strong>Tip:</strong>
                  {{ t("help.postJob.sections.manage.tip") }}
                </p>
              </div>
            </div>
          </div>

          <div :id="'section-7'" class="scroll-mt-20">
            <h2 class="text-3xl font-bold mb-4 text-gray-900">
              {{ t("help.postJob.sections.mistakes.title") }}
            </h2>
            <div class="space-y-6">
              <div class="space-y-3">
                <div v-for="(item, index) in 6" :key="index" class="bg-red-50 p-4 rounded-lg border-l-4 border-red-600">
                  <h4 class="font-semibold text-red-900 mb-2">{{ t(`help.postJob.sections.mistakes.bullets.${index}`) }}</h4>
                </div>
              </div>
            </div>
          </div>

          <div :id="'section-8'" class="scroll-mt-20">
            <h2 class="text-3xl font-bold mb-4 text-gray-900">
              {{ t("help.postJob.sections.optimize.title") }}
            </h2>
            <div class="space-y-6">
              <p class="text-gray-700">{{ t("help.postJob.sections.optimize.body") }}</p>
              <div class="bg-linear-to-r from-blue-50 to-cyan-50 p-6 rounded-lg">
                <ul class="space-y-2 text-gray-700 list-disc list-inside">
                  <li v-for="(tip, index) in 8" :key="index">
                    {{ t(`help.postJob.sections.optimize.tips.${index}`) }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div :id="'section-9'" class="scroll-mt-20">
            <h2 class="text-3xl font-bold mb-4 text-gray-900">
              {{ t("help.postJob.sections.after.title") }}
            </h2>
            <div class="space-y-6">
              <p class="text-gray-700">{{ t("help.postJob.sections.after.body") }}</p>
              <div class="bg-orange-50 p-6 rounded-lg">
                <ol class="space-y-2 text-gray-700 list-decimal list-inside">
                  <li v-for="(step, index) in 7" :key="index">
                    {{ t(`help.postJob.sections.after.steps.${index}`) }}
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-12 bg-blue-600 text-white">
      <div class="max-w-290 mx-auto px-4 text-center">
        <h2 class="text-2xl font-semibold mb-4">{{ t("help.postJob.cta.title") }}</h2>
        <p class="mb-6 text-blue-100">{{ t("help.postJob.cta.subtitle") }}</p>
        <router-link
          to="/recruiter/jobs/create"
          class="inline-block px-6 py-3 bg-white text-blue-600 rounded font-semibold hover:bg-gray-100"
        >
          {{ t("help.postJob.cta.button") }}
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
  { id: "section-1", title: t("help.postJob.toc.start.title"), description: t("help.postJob.toc.start.desc") },
  { id: "section-2", title: t("help.postJob.toc.description.title"), description: t("help.postJob.toc.description.desc") },
  { id: "section-3", title: t("help.postJob.toc.details.title"), description: t("help.postJob.toc.details.desc") },
  { id: "section-4", title: t("help.postJob.toc.skills.title"), description: t("help.postJob.toc.skills.desc") },
  { id: "section-5", title: t("help.postJob.toc.attract.title"), description: t("help.postJob.toc.attract.desc") },
  { id: "section-6", title: t("help.postJob.toc.manage.title"), description: t("help.postJob.toc.manage.desc") },
  { id: "section-7", title: t("help.postJob.toc.mistakes.title"), description: t("help.postJob.toc.mistakes.desc") },
  { id: "section-8", title: t("help.postJob.toc.optimize.title"), description: t("help.postJob.toc.optimize.desc") },
  { id: "section-9", title: t("help.postJob.toc.after.title"), description: t("help.postJob.toc.after.desc") },
]);

function scrollToSection(sectionId) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
}

onMounted(() => {
  document.title = t("help.postJob.pageTitle");
});

watch(locale, () => {
  document.title = t("help.postJob.pageTitle");
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
