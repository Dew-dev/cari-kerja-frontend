<template>
  <div class="privacy-page bg-[#f7f9fc] min-h-[70vh]">
    <!-- Hero -->
    <section class="border-b border-[#e8eef5] bg-white">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <p class="text-sm font-medium tracking-wide text-[#0a9cf5] mb-3">
          Cari Kerja
        </p>
        <h1 class="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
          {{ t("privacyPolicy.title") }}
        </h1>
        <p class="mt-3 text-base md:text-lg text-slate-500 max-w-2xl leading-relaxed">
          {{ t("privacyPolicy.subtitle") }}
        </p>
        <p class="mt-4 text-sm text-slate-400">
          {{ t("privacyPolicy.lastUpdated") }}
        </p>
      </div>
    </section>

    <!-- Body -->
    <section class="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-14">
      <div class="lg:grid lg:grid-cols-12 lg:gap-12 xl:gap-16">
        <!-- TOC: mobile chips -->
        <nav
          class="lg:hidden mb-8 -mx-4 px-4 overflow-x-auto scrollbar-hide"
          aria-label="Table of contents"
        >
          <p class="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">
            {{ t("privacyPolicy.onThisPage") }}
          </p>
          <ul class="flex gap-2 pb-1 min-w-max">
            <li v-for="section in sections" :key="`m-${section.id}`">
              <a
                :href="`#${section.id}`"
                :class="[
                  'inline-block rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                  activeId === section.id
                    ? 'border-[#0a9cf5] bg-[#0a9cf5]/10 text-[#0a9cf5]'
                    : 'border-[#e8eef5] bg-white text-slate-600 hover:border-[#0a9cf5]/40 hover:text-[#0a9cf5]',
                ]"
              >
                {{ section.shortTitle }}
              </a>
            </li>
          </ul>
        </nav>

        <!-- TOC: desktop sticky -->
        <aside class="hidden lg:block lg:col-span-4">
          <div class="sticky top-24">
            <p class="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">
              {{ t("privacyPolicy.onThisPage") }}
            </p>
            <nav
              class="border-l border-[#e8eef5] space-y-0.5"
              aria-label="Table of contents"
            >
              <a
                v-for="section in sections"
                :key="section.id"
                :href="`#${section.id}`"
                :aria-current="activeId === section.id ? 'location' : undefined"
                :class="[
                  'block pl-4 py-1.5 text-sm border-l-2 -ml-px transition-colors',
                  activeId === section.id
                    ? 'text-[#0a9cf5] border-[#0a9cf5] font-medium'
                    : 'text-slate-500 border-transparent hover:text-[#0a9cf5] hover:border-[#0a9cf5]',
                ]"
              >
                {{ section.shortTitle }}
              </a>
            </nav>
          </div>
        </aside>

        <!-- Content -->
        <article class="lg:col-span-8 space-y-0">
          <!-- 1. Introduction -->
          <section :id="sections[0].id" class="privacy-section scroll-mt-24">
            <h2 class="privacy-heading">
              {{ t("privacyPolicy.introduction.title") }}
            </h2>
            <p class="privacy-body">
              {{ t("privacyPolicy.introduction.content") }}
            </p>
          </section>

          <!-- 2. Information Collection -->
          <section :id="sections[1].id" class="privacy-section scroll-mt-24">
            <h2 class="privacy-heading">
              {{ t("privacyPolicy.informationCollection.title") }}
            </h2>
            <p class="privacy-body mb-4">
              {{ t("privacyPolicy.informationCollection.intro") }}
            </p>
            <ul class="privacy-list">
              <li v-for="item in collectionItems" :key="item.titleKey">
                <span class="font-medium text-slate-800">{{ t(item.titleKey) }}</span>
                {{ t(item.bodyKey) }}
              </li>
            </ul>
          </section>

          <!-- 3. Use of Data -->
          <section :id="sections[2].id" class="privacy-section scroll-mt-24">
            <h2 class="privacy-heading">
              {{ t("privacyPolicy.useOfData.title") }}
            </h2>
            <p class="privacy-body mb-4">
              {{ t("privacyPolicy.useOfData.content") }}
            </p>
            <ul class="privacy-list">
              <li v-for="(item, idx) in useOfDataItems" :key="idx">
                {{ item }}
              </li>
            </ul>
          </section>

          <!-- 4. Security -->
          <section :id="sections[3].id" class="privacy-section scroll-mt-24">
            <h2 class="privacy-heading">
              {{ t("privacyPolicy.security.title") }}
            </h2>
            <p class="privacy-body">
              {{ t("privacyPolicy.security.content") }}
            </p>
          </section>

          <!-- 5. Cookies -->
          <section :id="sections[4].id" class="privacy-section scroll-mt-24">
            <h2 class="privacy-heading">
              {{ t("privacyPolicy.cookies.title") }}
            </h2>
            <p class="privacy-body">
              {{ t("privacyPolicy.cookies.content") }}
            </p>
          </section>

          <!-- 6. Third-Party Access -->
          <section :id="sections[5].id" class="privacy-section scroll-mt-24">
            <h2 class="privacy-heading">
              {{ t("privacyPolicy.thirdPartyAccess.title") }}
            </h2>
            <p class="privacy-body">
              {{ t("privacyPolicy.thirdPartyAccess.content") }}
            </p>
          </section>

          <!-- 7. Disclosure -->
          <section :id="sections[6].id" class="privacy-section scroll-mt-24">
            <h2 class="privacy-heading">
              {{ t("privacyPolicy.disclosure.title") }}
            </h2>
            <p class="privacy-body mb-4">
              {{ t("privacyPolicy.disclosure.intro") }}
            </p>
            <ul class="privacy-list">
              <li>{{ t("privacyPolicy.disclosure.items.byLaw") }}</li>
              <li>{{ t("privacyPolicy.disclosure.items.protect") }}</li>
              <li>{{ t("privacyPolicy.disclosure.items.merger") }}</li>
              <li>{{ t("privacyPolicy.disclosure.items.consent") }}</li>
            </ul>
          </section>

          <!-- 8. Retention -->
          <section :id="sections[7].id" class="privacy-section scroll-mt-24">
            <h2 class="privacy-heading">
              {{ t("privacyPolicy.retention.title") }}
            </h2>
            <p class="privacy-body">
              {{ t("privacyPolicy.retention.content") }}
            </p>
          </section>

          <!-- 9. Rights -->
          <section :id="sections[8].id" class="privacy-section scroll-mt-24">
            <h2 class="privacy-heading">
              {{ t("privacyPolicy.rights.title") }}
            </h2>
            <p class="privacy-body mb-4">
              {{ t("privacyPolicy.rights.intro") }}
            </p>
            <ul class="privacy-list">
              <li v-for="(item, idx) in rightsItems" :key="idx">
                {{ item }}
              </li>
            </ul>
          </section>

          <!-- 10. Changes -->
          <section :id="sections[9].id" class="privacy-section scroll-mt-24">
            <h2 class="privacy-heading">
              {{ t("privacyPolicy.changes.title") }}
            </h2>
            <p class="privacy-body">
              {{ t("privacyPolicy.changes.content") }}
            </p>
          </section>

          <!-- 11. Contact -->
          <section :id="sections[10].id" class="privacy-section scroll-mt-24 border-b-0">
            <h2 class="privacy-heading">
              {{ t("privacyPolicy.contact.title") }}
            </h2>
            <p class="privacy-body mb-5">
              {{ t("privacyPolicy.contact.intro") }}
            </p>
            <div class="rounded-lg border border-[#e8eef5] bg-white p-5 sm:p-6">
              <dl class="space-y-3 text-sm">
                <div class="flex flex-col sm:flex-row sm:gap-3">
                  <dt class="font-medium text-slate-800 shrink-0 sm:w-24">
                    {{ t("privacyPolicy.contact.emailLabel") }}
                  </dt>
                  <dd>
                    <a
                      :href="`mailto:${t('privacyPolicy.contact.email')}`"
                      class="text-[#0a9cf5] hover:underline break-all"
                    >
                      {{ t("privacyPolicy.contact.email") }}
                    </a>
                  </dd>
                </div>
                <div class="flex flex-col sm:flex-row sm:gap-3">
                  <dt class="font-medium text-slate-800 shrink-0 sm:w-24">
                    {{ t("privacyPolicy.contact.addressLabel") }}
                  </dt>
                  <dd class="text-slate-600">
                    {{ t("privacyPolicy.contact.address") }}
                  </dd>
                </div>
              </dl>
              <router-link
                to="/contact"
                class="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[#0a9cf5] hover:underline"
              >
                {{ t("privacyPolicy.contact.contactPageLink") }}
                <span aria-hidden="true">→</span>
              </router-link>
            </div>
          </section>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

const { t, locale, getLocaleMessage } = useI18n({ useScope: "global" });

/** Matches scroll-mt-24 / sticky header offset */
const SCROLL_OFFSET = 96;

const activeId = ref("introduction");
let rafId = 0;

const sections = computed(() => [
  {
    id: "introduction",
    shortTitle: t("privacyPolicy.toc.introduction"),
  },
  {
    id: "information-collection",
    shortTitle: t("privacyPolicy.toc.informationCollection"),
  },
  {
    id: "use-of-data",
    shortTitle: t("privacyPolicy.toc.useOfData"),
  },
  {
    id: "security",
    shortTitle: t("privacyPolicy.toc.security"),
  },
  {
    id: "cookies",
    shortTitle: t("privacyPolicy.toc.cookies"),
  },
  {
    id: "third-party",
    shortTitle: t("privacyPolicy.toc.thirdPartyAccess"),
  },
  {
    id: "disclosure",
    shortTitle: t("privacyPolicy.toc.disclosure"),
  },
  {
    id: "retention",
    shortTitle: t("privacyPolicy.toc.retention"),
  },
  {
    id: "rights",
    shortTitle: t("privacyPolicy.toc.rights"),
  },
  {
    id: "changes",
    shortTitle: t("privacyPolicy.toc.changes"),
  },
  {
    id: "contact",
    shortTitle: t("privacyPolicy.toc.contact"),
  },
]);

const collectionItems = [
  {
    titleKey: "privacyPolicy.informationCollection.items.accountTitle",
    bodyKey: "privacyPolicy.informationCollection.items.account",
  },
  {
    titleKey: "privacyPolicy.informationCollection.items.profileTitle",
    bodyKey: "privacyPolicy.informationCollection.items.profile",
  },
  {
    titleKey: "privacyPolicy.informationCollection.items.applicationTitle",
    bodyKey: "privacyPolicy.informationCollection.items.application",
  },
  {
    titleKey: "privacyPolicy.informationCollection.items.technicalTitle",
    bodyKey: "privacyPolicy.informationCollection.items.technical",
  },
  {
    titleKey: "privacyPolicy.informationCollection.items.communicationTitle",
    bodyKey: "privacyPolicy.informationCollection.items.communication",
  },
];

const useOfDataItems = computed(() => {
  const msg = getLocaleMessage(locale.value)?.privacyPolicy?.useOfData?.items;
  if (!msg) return [];
  return Array.isArray(msg) ? msg : Object.values(msg);
});

const rightsItems = computed(() => {
  const msg = getLocaleMessage(locale.value)?.privacyPolicy?.rights?.items;
  if (!msg) return [];
  return Array.isArray(msg) ? msg : Object.values(msg);
});

function setTitle() {
  document.title = t("privacyPolicy.pageTitle");
}

function updateActiveSection() {
  const ids = sections.value.map((s) => s.id);
  let current = ids[0];

  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.getBoundingClientRect().top <= SCROLL_OFFSET + 8) {
      current = id;
    }
  }

  activeId.value = current;
}

function onScroll() {
  if (rafId) return;
  rafId = requestAnimationFrame(() => {
    rafId = 0;
    updateActiveSection();
  });
}

onMounted(() => {
  setTitle();
  updateActiveSection();
  window.addEventListener("scroll", onScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
  if (rafId) cancelAnimationFrame(rafId);
});

watch(locale, setTitle);
</script>

<style scoped>
:global(html) {
  scroll-behavior: smooth;
}

.privacy-section {
  padding-bottom: 2rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid #e8eef5;
}

.privacy-heading {
  font-size: 1.125rem;
  line-height: 1.4;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 0.75rem;
  letter-spacing: -0.01em;
}

@media (min-width: 768px) {
  .privacy-heading {
    font-size: 1.25rem;
  }
}

.privacy-body {
  font-size: 0.9375rem;
  line-height: 1.7;
  color: #475569;
}

.privacy-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.privacy-list li {
  position: relative;
  padding-left: 1.125rem;
  font-size: 0.9375rem;
  line-height: 1.65;
  color: #475569;
}

.privacy-list li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.55em;
  width: 5px;
  height: 5px;
  border-radius: 9999px;
  background: #0a9cf5;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
