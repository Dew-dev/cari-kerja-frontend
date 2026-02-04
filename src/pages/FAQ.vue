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
                class="px-4 bg-blue-600 text-white font-semibold hover:opacity-95 focus:outline-none w-full sm:w-auto"
                aria-label="Search"
              >
                {{ t("faq.searchButton") }}
              </button>
            </div>
            <p v-if="query" class="text-sm text-gray-600 mt-2">
              Showing results for "{{ query }}" — use the categories below to
              refine.
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
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

const router = useRouter();
const { t } = useI18n();
const query = ref("");
const openIndex = ref(null);

const categories = [
  {
    id: "seekers",
    title: t("faq.categories.seekers.title"),
    description: t("faq.categories.seekers.description"),
    links: [
      { label: t("faq.categories.seekers.links.apply"), to: "/jobs" },
      { label: t("faq.categories.seekers.links.cv"), to: "/profile" },
      {
        label: t("faq.categories.seekers.links.applications"),
        to: "/profile",
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
        to: "/recruiter/create-job",
      },
      {
        label: t("faq.categories.employers.links.searchResumes"),
        to: "/recruiter",
      },
      {
        label: t("faq.categories.employers.links.pricing"),
        to: "/pricing",
      },
    ],
  },
  {
    id: "account",
    title: t("faq.categories.account.title"),
    description: t("faq.categories.account.description"),
    links: [
      {
        label: t("faq.categories.account.links.register"),
        to: "/auth/login",
      },
      {
        label: t("faq.categories.account.links.reset"),
        to: "/auth/forgot",
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
        to: "/contact",
      },
      { label: t("faq.categories.technical.links.browsers"), to: "/" },
    ],
  },
];

const faqs = [
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
];

const popular = [
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
];

function toggle(i) {
  openIndex.value = openIndex.value === i ? null : i;
}

function onSearch() {
  // Lightweight placeholder: in a full implementation we'd query the backend
  if (!query.value) return;
  // scroll to FAQ section and open first matching item
  const first = faqs.findIndex((f) =>
    f.q.toLowerCase().includes(query.value.toLowerCase()),
  );
  if (first >= 0) {
    openIndex.value = first;
    // smooth scroll to the matched item
    setTimeout(() => {
      const el = document.querySelectorAll(
        ".max-w-290 .bg-white.border.rounded",
      )[first];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }
}

function navigate(to) {
  // small defensive check: if it's an external link or mailto/tel, just navigate
  if (!to) return;
  // prefer router for internal routes
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

onMounted(() => {
  document.title = t("faq.title");
});
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
