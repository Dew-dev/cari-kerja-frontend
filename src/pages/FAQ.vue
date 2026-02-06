<template>
  <div class="bg-white">
    <!-- Hero -->
    <section class="py-12 bg-linear-to-r from-blue-50 to-white">
      <div class="max-w-290 mx-auto px-4">
        <div class="text-center">
          <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            {{ t("faq.title") }}
          </h1>
          <p class="text-gray-700 mb-6">{{ t("faq.subtitle") }}</p>

          <div class="max-w-xl mx-auto">
            <div
              class="flex flex-col sm:flex-row items-stretch border rounded overflow-hidden"
            >
              <input
                v-model="query"
                @keyup.enter="onSearch"
                type="search"
                :placeholder="t('faq.searchPlaceholder')"
                class="w-full px-4 py-3 focus:outline-none rounded-none sm:rounded-l"
                aria-label="Search help"
              />
              <button
                type="button"
                @click="onSearch"
                :disabled="!query.trim()"
                class="px-4 bg-blue-600 text-white font-semibold hover:opacity-95 focus:outline-none w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Search"
              >
                {{ t("faq.searchButton") }}
              </button>
              <button
                v-if="query"
                type="button"
                @click="clearSearch"
                class="px-4 bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 focus:outline-none w-full sm:w-auto"
                aria-label="Clear search"
              >
                ✕
              </button>
            </div>
            <p v-if="query && searchResultsCount !== null" class="text-sm text-gray-600 mt-2">
              {{ searchResultsCount }}
              {{ searchResultsCount === 1 ? t("faq.resultSingular") : t("faq.resultPlural") }}
              {{ t("faq.resultsFoundFor") }} "{{ query }}"
            </p>
            <p v-else-if="query && searchResultsCount === 0" class="text-sm text-red-600 mt-2">
              {{ t("faq.noResults", { query }) }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Categories -->
    <section class="py-10">
      <div class="max-w-290 mx-auto px-4">
        <h2 class="text-2xl font-semibold mb-4">
          {{ t("faq.categoriesHeading") || "Popular categories" }}
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="cat in categories"
            :key="cat.id"
            class="p-4 border rounded hover:shadow"
          >
            <h3 class="font-semibold mb-2">{{ cat.title }}</h3>
            <p class="text-sm text-gray-600 mb-3">{{ cat.description }}</p>
            <ul class="text-sm space-y-1">
              <li v-for="(item, i) in cat.links" :key="i">
                <button
                  type="button"
                  @click="navigate(item.to)"
                  class="text-blue-600 hover:underline focus:outline-none inline-flex items-center gap-2 py-2 w-full text-left"
                >
                  {{ item.label }}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Accordion -->
    <section class="py-10 bg-gray-50">
      <div class="max-w-290 mx-auto px-4">
        <h2 class="text-2xl font-semibold mb-4">{{ t("faq.title") }}</h2>

        <div class="space-y-3">
          <div
            v-for="(faq, idx) in faqs"
            :key="idx"
            class="bg-white border rounded"
          >
            <button
              @click="toggle(idx)"
              :aria-expanded="openIndex === idx"
              :aria-controls="`faq-${idx}`"
              class="w-full text-left px-4 py-4 sm:py-3 flex justify-between items-start focus:outline-none"
            >
              <div>
                <div class="font-medium">{{ faq.q }}</div>
                <div class="text-sm text-gray-600 mt-1">{{ faq.tag }}</div>
              </div>
              <div class="ml-4 text-gray-500" aria-hidden="true">
                {{ openIndex === idx ? "−" : "+" }}
              </div>
            </button>

            <transition name="fade">
              <div
                v-show="openIndex === idx"
                :id="`faq-${idx}`"
                class="px-4 pb-4 text-gray-700"
              >
                <p v-html="faq.a"></p>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </section>

    <!-- Popular articles -->
    <section class="py-10">
      <div class="max-w-290 mx-auto px-4">
        <h2 class="text-2xl font-semibold mb-4">
          {{ t("faq.popularHeading") || "Popular help articles" }}
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            v-for="(art, i) in popular"
            :key="i"
            class="p-4 border rounded hover:bg-gray-50"
          >
            <button
              type="button"
              @click="navigate(art.to)"
              class="font-medium text-blue-600 hover:underline focus:outline-none w-full text-left sm:w-auto"
            >
              {{ art.title }}
            </button>
            <p class="text-sm text-gray-600 mt-1">{{ art.excerpt }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact support -->
    <section class="py-12 bg-blue-600 text-white">
      <div class="max-w-290 mx-auto px-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
          <div>
            <h3 class="text-xl font-semibold">
              {{ t("faq.contact.stillNeedHelp") }}
            </h3>
            <p class="mt-2 text-sm">{{ t("faq.contact.supportSubtitle") }}</p>
          </div>

          <div
            class="sm:col-span-2 flex flex-col sm:flex-row gap-3 justify-end items-stretch sm:items-center"
          >
            <button
              type="button"
              @click="emailSupport"
              class="px-4 py-3 bg-white text-blue-600 rounded font-semibold w-full sm:w-auto"
            >
              {{ t("faq.contact.emailSupport") }}
            </button>
            <button
              type="button"
              @click="callSupport"
              class="px-4 py-3 border border-white rounded w-full sm:w-auto"
            >
              {{ t("faq.contact.callUs") }}
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
<<<<<<< HEAD
import { ref, computed, watch } from "vue";
=======
import { ref, onMounted, computed, watch } from "vue";
>>>>>>> 944e0b2f0b5b91f281df8c6bc7af40bf85de1341
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

const router = useRouter();
const { t, locale } = useI18n();
const query = ref("");
const openIndex = ref(null);

<<<<<<< HEAD
// Make categories, faqs and popular computed so they re-evaluate when locale changes
=======
>>>>>>> 944e0b2f0b5b91f281df8c6bc7af40bf85de1341
const categories = computed(() => [
  {
    id: "seekers",
    title: t("faq.categories.seekers.title"),
    description: t("faq.categories.seekers.description"),
    links: [
      { label: t("faq.categories.seekers.links.apply"), to: "/help/apply" },
      { label: t("faq.categories.seekers.links.cv"), to: "/help/cv" },
      {
        label: t("faq.categories.seekers.links.applications"),
        to: "/help/applications",
      },
    ],
  },
  {
    id: "employers",
    title: t("faq.categories.employers.title"),
    description: t("faq.categories.employers.description"),
    links: [
      {
        label: t("faq.categories.employers.links.postJob"),
        to: "/help/post-job",
      },
      {
        label: t("faq.categories.employers.links.searchResumes"),
        to: "/help/search-resumes",
      },
      // {
      //   label: t("faq.categories.employers.links.pricing"),
      //   to: "/help/pricing",
      // },
    ],
  },
  {
    id: "account",
    title: t("faq.categories.account.title"),
    description: t("faq.categories.account.description"),
    links: [
      {
        label: t("faq.categories.account.links.register"),
        to: "/help/register",
      },
      {
        label: t("faq.categories.account.links.reset"),
        to: "/help/reset-password",
      },
    ],
  },
  {
    id: "technical",
    title: t("faq.categories.technical.title"),
    description: t("faq.categories.technical.description"),
    links: [
      {
        label: t("faq.categories.technical.links.report"),
        to: "/help/report-issue",
      },
      {
        label: t("faq.categories.technical.links.browsers"),
        to: "/help/supported-browsers",
      },
    ],
  },
]);

<<<<<<< HEAD
const faqs = computed(() => [
=======
const allFaqs = computed(() => [
>>>>>>> 944e0b2f0b5b91f281df8c6bc7af40bf85de1341
  {
    q: t("faq.faqs.0.q"),
    a: t("faq.faqs.0.a"),
    tag: t("faq.faqs.0.tag"),
  },
  {
    q: t("faq.faqs.1.q"),
    a: t("faq.faqs.1.a"),
    tag: t("faq.faqs.1.tag"),
  },
  {
    q: t("faq.faqs.2.q"),
    a: t("faq.faqs.2.a"),
    tag: t("faq.faqs.2.tag"),
  },
  {
    q: t("faq.faqs.3.q"),
    a: t("faq.faqs.3.a"),
    tag: t("faq.faqs.3.tag"),
  },
]);

<<<<<<< HEAD
=======
const faqs = computed(() => {
  if (!query.value.trim()) {
    return allFaqs.value;
  }

  const searchTerm = query.value.toLowerCase();
  return allFaqs.value.filter((faq) => {
    const question = faq.q.toLowerCase();
    const answer = faq.a.toLowerCase();
    const tag = faq.tag.toLowerCase();
    return (
      question.includes(searchTerm) ||
      answer.includes(searchTerm) ||
      tag.includes(searchTerm)
    );
  });
});

const searchResultsCount = computed(() => {
  if (!query.value.trim()) {
    return null;
  }
  return faqs.value.length;
});

>>>>>>> 944e0b2f0b5b91f281df8c6bc7af40bf85de1341
const popular = computed(() => [
  {
    title: t("faq.popular.0.title"),
    excerpt: t("faq.popular.0.excerpt"),
    to: "/help/apply",
  },
  {
    title: t("faq.popular.1.title"),
    excerpt: t("faq.popular.1.excerpt"),
    to: "/help/post-job",
  },
]);

function toggle(i) {
  openIndex.value = openIndex.value === i ? null : i;
}

function onSearch() {
<<<<<<< HEAD
  // Lightweight placeholder: in a full implementation we'd query the backend
  if (!query.value) return;
  // scroll to FAQ section and open first matching item
  const first = faqs.value.findIndex((f) =>
    f.q.toLowerCase().includes(query.value.toLowerCase()),
  );
  if (first >= 0) {
    openIndex.value = first;
    // smooth scroll to the matched item
=======
  if (!query.value.trim()) return;

  // Close any open accordion and open first result
  if (faqs.value.length > 0) {
    const firstIndex = allFaqs.value.findIndex((f) => f === faqs.value[0]);
    openIndex.value = firstIndex;

    // Smooth scroll to the matched item
>>>>>>> 944e0b2f0b5b91f281df8c6bc7af40bf85de1341
    setTimeout(() => {
      const sections = document.querySelectorAll(".bg-gray-50 .space-y-3");
      if (sections[0]) {
        sections[0].scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  }
}

function clearSearch() {
  query.value = "";
  openIndex.value = null;
}

function navigate(to) {
  if (!to) return;
  if (
    to.startsWith("http") ||
    to.startsWith("mailto:") ||
    to.startsWith("tel:")
  ) {
    window.location.href = to;
    return;
  }
  router.push(to).catch(() => {});
}

function emailSupport() {
  window.location.href = "mailto:support@jobs.uz";
}

function callSupport() {
  window.location.href = "tel:+998901234567";
}

<<<<<<< HEAD
// Keep document title in sync with locale changes
watch(
  () => t("faq.title"),
  (val) => {
    document.title = val;
  },
  { immediate: true },
);
=======
onMounted(() => {
  document.title = t("faq.title");
});

watch(locale, () => {
  document.title = t("faq.title");
});
>>>>>>> 944e0b2f0b5b91f281df8c6bc7af40bf85de1341
</script>

<style scoped>
.max-w-290 {
  max-width: 1100px;
}

/* small helpers to match existing design */
.bg-linear-to-r {
  background-image: linear-gradient(
    90deg,
    rgba(59, 130, 246, 0.06),
    rgba(255, 255, 255, 0)
  );
}

/* fade transition for accordion */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
