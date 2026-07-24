<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  getNewsBySlug,
  isNewsLocaleFallback,
  resolveNewsLocale,
} from "@/services/news.api";
import RichTextContent from "@/components/common/RichTextContent.vue";

const props = defineProps({
  slug: {
    type: String,
    default: "",
  },
});

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();

const fileStorageUrl = import.meta.env.VITE_FILE_STORAGE_URL || "";

const article = ref(null);
const loading = ref(false);
const error = ref("");

const activeSlug = computed(() => props.slug || String(route.params.slug || ""));
const newsLocale = computed(() => resolveNewsLocale(locale.value));
const showLocaleFallback = computed(() => isNewsLocaleFallback(article.value));

function resolveCover(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${fileStorageUrl}${url}`;
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(locale.value === "id" ? "id-ID" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function syncTitle() {
  if (!article.value) {
    document.title = t("news.pageTitle");
    return;
  }
  document.title =
    article.value.meta_title ||
    `${article.value.title} — Cari Kerja`;
}

async function loadArticle() {
  if (!activeSlug.value) return;
  loading.value = true;
  error.value = "";
  article.value = null;
  try {
    const res = await getNewsBySlug(activeSlug.value, {
      locale: newsLocale.value,
    });
    article.value = res.data?.data || null;
    if (!article.value) {
      error.value = t("news.notFound");
      return;
    }
    syncTitle();
    // Prefer locale-specific slug in the URL when it differs.
    const resolvedSlug = article.value.slug;
    if (
      resolvedSlug &&
      resolvedSlug !== activeSlug.value &&
      !isNewsLocaleFallback(article.value)
    ) {
      router.replace({
        name: "news-detail",
        params: { slug: resolvedSlug },
      });
    }
  } catch (err) {
    const status = err?.response?.status;
    error.value =
      status === 404
        ? t("news.notFound")
        : err?.response?.data?.message || t("news.loadFailed");
  } finally {
    loading.value = false;
  }
}

watch(activeSlug, () => loadArticle());
watch(locale, () => {
  syncTitle();
  loadArticle();
});

onMounted(loadArticle);
</script>

<template>
  <div class="bg-white min-h-screen">
    <div class="max-w-290 mx-auto px-4 py-6 md:py-10">
      <button
        type="button"
        class="text-sm text-blue-600 hover:underline mb-6"
        @click="router.push({ name: 'news' })"
      >
        ← {{ t("news.backToList") }}
      </button>

      <div v-if="loading" class="py-20 text-center text-gray-500 text-sm">
        {{ t("news.loading") }}
      </div>

      <div
        v-else-if="error"
        class="py-16 text-center space-y-4"
      >
        <p class="text-red-600 text-sm">{{ error }}</p>
        <router-link
          :to="{ name: 'news' }"
          class="inline-flex px-4 py-2 bg-blue-600 text-white text-sm rounded-lg"
        >
          {{ t("news.backToList") }}
        </router-link>
      </div>

      <article v-else-if="article" class="max-w-3xl mx-auto">
        <div class="mb-4 flex flex-wrap items-center gap-2 text-xs">
          <span
            v-if="article.is_featured"
            class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium"
          >
            {{ t("news.featured") }}
          </span>
          <span
            v-if="showLocaleFallback"
            class="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium"
            :title="t('news.localeFallbackHint', { locale: article.locale_resolved })"
          >
            {{ t("news.localeFallback", { locale: String(article.locale_resolved || "").toUpperCase() }) }}
          </span>
          <router-link
            v-if="article.category_slug"
            :to="{ name: 'news', query: { category_slug: article.category_slug } }"
            class="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium hover:bg-blue-100"
          >
            {{ article.category_name }}
          </router-link>
          <span class="text-gray-400">{{ formatDate(article.published_at) }}</span>
          <span v-if="article.author_username" class="text-gray-400">
            · {{ article.author_username }}
          </span>
        </div>

        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
          {{ article.title }}
        </h1>

        <p v-if="article.excerpt" class="text-lg text-gray-600 mb-6">
          {{ article.excerpt }}
        </p>

        <div
          v-if="resolveCover(article.cover_url)"
          class="mb-8 rounded-xl overflow-hidden bg-gray-100"
        >
          <img
            :src="resolveCover(article.cover_url)"
            :alt="article.title"
            class="w-full max-h-[420px] object-cover"
          />
        </div>

        <RichTextContent
          v-if="article.body"
          :html="article.body"
          class="!prose-base"
        />
      </article>
    </div>
  </div>
</template>
