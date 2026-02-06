<template>
  <div class="bg-white">
    <!-- Hero -->
    <section class="py-12 bg-linear-to-r from-blue-50 to-white">
      <div class="max-w-290 mx-auto px-4">
        <div class="max-w-3xl">
          <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {{ t("help.register.heroTitle") }}
          </h1>
          <p class="text-gray-700 text-lg">
            {{ t("help.register.heroSubtitle") }}
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
              {{ t("help.register.sections.type.title") }}
            </h2>
            <div class="bg-blue-50 p-6 rounded-lg text-gray-700">
              {{ t("help.register.sections.type.body") }}
            </div>
          </div>

          <div :id="'section-2'" class="scroll-mt-20">
            <h2 class="text-3xl font-bold mb-4 text-gray-900">
              {{ t("help.register.sections.registration.title") }}
            </h2>
            <div class="bg-green-50 p-6 rounded-lg">
              <ul class="space-y-2 text-gray-700">
                <li>{{ t("help.register.sections.registration.bullets.0") }}</li>
                <li>{{ t("help.register.sections.registration.bullets.1") }}</li>
                <li>{{ t("help.register.sections.registration.bullets.2") }}</li>
              </ul>
            </div>
          </div>

          <div :id="'section-3'" class="scroll-mt-20">
            <h2 class="text-3xl font-bold mb-4 text-gray-900">
              {{ t("help.register.sections.verify.title") }}
            </h2>
            <div class="bg-yellow-50 p-6 rounded-lg text-gray-700">
              {{ t("help.register.sections.verify.body") }}
            </div>
          </div>

          <div :id="'section-4'" class="scroll-mt-20">
            <h2 class="text-3xl font-bold mb-4 text-gray-900">
              {{ t("help.register.sections.profile.title") }}
            </h2>
            <div class="bg-purple-50 p-6 rounded-lg text-gray-700">
              {{ t("help.register.sections.profile.body") }}
            </div>
          </div>

          <div :id="'section-5'" class="scroll-mt-20">
            <h2 class="text-3xl font-bold mb-4 text-gray-900">
              {{ t("help.register.sections.security.title") }}
            </h2>
            <div class="bg-indigo-50 p-6 rounded-lg text-gray-700">
              {{ t("help.register.sections.security.body") }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-12 bg-blue-600 text-white">
      <div class="max-w-290 mx-auto px-4 text-center">
        <h2 class="text-2xl font-semibold mb-4">{{ t("help.register.cta.title") }}</h2>
        <p class="mb-6 text-blue-100">{{ t("help.register.cta.subtitle") }}</p>
        <router-link
          to="/register"
          class="inline-block px-6 py-3 bg-white text-blue-600 rounded font-semibold hover:bg-gray-100"
        >
          {{ t("help.register.cta.buttonSeeker") }}
        </router-link>
        <div class="mt-4 text-blue-100">
          {{ t("help.register.cta.recruiterText") }}
          <router-link to="/register-recruiter" class="underline">{{ t("help.register.cta.buttonRecruiter") }}</router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();

const tableOfContents = computed(() => [
  { id: "section-1", title: t("help.register.toc.type.title"), description: t("help.register.toc.type.desc") },
  { id: "section-2", title: t("help.register.toc.registration.title"), description: t("help.register.toc.registration.desc") },
  { id: "section-3", title: t("help.register.toc.verify.title"), description: t("help.register.toc.verify.desc") },
  { id: "section-4", title: t("help.register.toc.profile.title"), description: t("help.register.toc.profile.desc") },
  { id: "section-5", title: t("help.register.toc.security.title"), description: t("help.register.toc.security.desc") },
]);

function scrollToSection(sectionId) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
}

onMounted(() => {
  document.title = t("help.register.pageTitle");
});

watch(locale, () => {
  document.title = t("help.register.pageTitle");
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
