<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  getNews,
  getNewsCategories,
  isNewsLocaleFallback,
  resolveNewsLocale,
} from "@/services/news.api";

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();

const fileStorageUrl = import.meta.env.VITE_FILE_STORAGE_URL || "";

const items = ref([]);
const categories = ref([]);
const loading = ref(false);
const error = ref("");
const searchInput = ref("");

const page = ref(1);
const limit = 10;
const totalPages = ref(1);
const totalData = ref(0);

const newsLocale = computed(() => resolveNewsLocale(locale.value));
const categorySlug = computed(() => String(route.query.category_slug || ""));
const featuredOnly = computed(
  () => route.query.featured === "true" || route.query.featured === true,
);
const searchQuery = computed(() => String(route.query.search || "").trim());

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
    month: "short",
    year: "numeric",
  });
}

function syncTitle() {
  document.title = t("news.pageTitle");
}

async function loadCategories() {
  try {
    const res = await getNewsCategories({ locale: newsLocale.value });
    categories.value = res.data?.data || [];
  } catch {
    categories.value = [];
  }
}

async function loadNews() {
  loading.value = true;
  error.value = "";
  try {
    const res = await getNews({
      page: page.value,
      limit,
      search: searchQuery.value || undefined,
      category_slug: categorySlug.value || undefined,
      featured: featuredOnly.value || undefined,
      locale: newsLocale.value,
    });
    items.value = res.data?.data || [];
    const meta = res.data?.meta || {};
    totalPages.value = Number(meta.total_pages) || 1;
    totalData.value = Number(meta.total_data) || 0;
    page.value = Number(meta.page) || page.value;
  } catch (err) {
    error.value =
      err?.response?.data?.message || t("news.loadFailed");
    items.value = [];
  } finally {
    loading.value = false;
  }
}

function updateQuery(patch) {
  const next = { ...route.query, ...patch };
  Object.keys(next).forEach((key) => {
    if (next[key] === "" || next[key] == null || next[key] === false) {
      delete next[key];
    }
  });
  router.push({ name: "news", query: next });
}

function onSearchSubmit() {
  updateQuery({
    search: searchInput.value.trim() || undefined,
    page: 1,
  });
}

function setCategory(slug) {
  updateQuery({
    category_slug: slug || undefined,
    page: 1,
  });
}

function toggleFeatured() {
  updateQuery({
    featured: featuredOnly.value ? undefined : "true",
    page: 1,
  });
}

function goToPage(p) {
  if (p < 1 || p > totalPages.value || p === page.value) return;
  updateQuery({ page: p });
}

function syncFromRoute() {
  page.value = Math.max(1, Number(route.query.page) || 1);
  searchInput.value = searchQuery.value;
  loadNews();
}

async function onLocaleChange() {
  syncTitle();
  // Category slugs are locale-specific — reset filter when language changes.
  if (categorySlug.value) {
    updateQuery({ category_slug: undefined, page: 1 });
    await loadCategories();
    return; // route watch will reload list
  }
  await loadCategories();
  await loadNews();
}

watch(
  () => [route.query.page, route.query.search, route.query.category_slug, route.query.featured],
  () => syncFromRoute(),
);

watch(locale, onLocaleChange);

onMounted(async () => {
  syncTitle();
  await loadCategories();
  syncFromRoute();
});
</script>

<template>
  <div class="bg-white min-h-screen">
    <section class="bg-linear-to-r from-blue-50 to-white py-10 md:py-12">
      <div class="max-w-290 mx-auto px-4">
        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          {{ t("news.title") }}
        </h1>
        <p class="text-gray-600 max-w-2xl">
          {{ t("news.subtitle") }}
        </p>
      </div>
    </section>

    <section class="py-8 md:py-10">
      <div class="max-w-290 mx-auto px-4 space-y-6">
        <!-- Filters -->
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <form class="flex flex-1 gap-2 max-w-xl" @submit.prevent="onSearchSubmit">
            <input
              v-model="searchInput"
              type="search"
              :placeholder="t('news.searchPlaceholder')"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              class="shrink-0 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              {{ t("news.search") }}
            </button>
          </form>

          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="px-3 py-1.5 text-sm rounded-full border transition"
              :class="
                featuredOnly
                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              "
              @click="toggleFeatured"
            >
              {{ t("news.featuredOnly") }}
            </button>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="px-3 py-1.5 text-sm rounded-full border transition"
            :class="
              !categorySlug
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            "
            @click="setCategory('')"
          >
            {{ t("news.allCategories") }}
          </button>
          <button
            v-for="cat in categories"
            :key="cat.id"
            type="button"
            class="px-3 py-1.5 text-sm rounded-full border transition"
            :class="
              categorySlug === cat.slug
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            "
            @click="setCategory(cat.slug)"
          >
            {{ cat.name }}
          </button>
        </div>

        <p v-if="!loading && !error" class="text-xs text-gray-500">
          {{ t("news.resultCount", { count: totalData }) }}
        </p>

        <div v-if="loading" class="py-16 text-center text-gray-500 text-sm">
          {{ t("news.loading") }}
        </div>
        <div
          v-else-if="error"
          class="py-10 text-center text-red-600 text-sm bg-red-50 rounded-lg"
        >
          {{ error }}
        </div>
        <div
          v-else-if="!items.length"
          class="py-16 text-center text-gray-500 text-sm"
        >
          {{ t("news.empty") }}
        </div>

        <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <router-link
            v-for="item in items"
            :key="item.id"
            :to="{ name: 'news-detail', params: { slug: item.slug } }"
            class="group flex flex-col rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition overflow-hidden"
          >
            <div class="aspect-[16/9] bg-gray-100 overflow-hidden">
              <img
                v-if="resolveCover(item.cover_url)"
                :src="resolveCover(item.cover_url)"
                :alt="item.title"
                class="w-full h-full object-cover group-hover:scale-[1.02] transition duration-300"
                @error="(e) => (e.target.style.display = 'none')"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center text-gray-300 text-sm"
              >
                {{ t("news.noCover") }}
              </div>
            </div>
            <div class="p-4 flex flex-col grow gap-2">
              <div class="flex flex-wrap items-center gap-2 text-[11px]">
                <span
                  v-if="item.is_featured"
                  class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium"
                >
                  {{ t("news.featured") }}
                </span>
                <span
                  v-if="isNewsLocaleFallback(item)"
                  class="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium"
                  :title="t('news.localeFallbackHint', { locale: item.locale_resolved })"
                >
                  {{ t("news.localeFallback", { locale: String(item.locale_resolved || "").toUpperCase() }) }}
                </span>
                <span
                  v-if="item.category_name"
                  class="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium"
                >
                  {{ item.category_name }}
                </span>
                <span class="text-gray-400">{{ formatDate(item.published_at) }}</span>
              </div>
              <h2 class="text-base font-semibold text-gray-900 group-hover:text-blue-600 line-clamp-2">
                {{ item.title }}
              </h2>
              <p class="text-sm text-gray-600 line-clamp-3 grow">
                {{ item.excerpt }}
              </p>
              <span class="text-sm font-medium text-blue-600">
                {{ t("news.readMore") }} →
              </span>
            </div>
          </router-link>
        </div>

        <!-- Pagination -->
        <div
          v-if="totalPages > 1"
          class="flex items-center justify-center gap-2 pt-4"
        >
          <button
            type="button"
            class="px-3 py-1.5 text-sm rounded border border-gray-200 disabled:opacity-40"
            :disabled="page <= 1"
            @click="goToPage(page - 1)"
          >
            {{ t("news.prev") }}
          </button>
          <span class="text-sm text-gray-600 px-2">
            {{ t("news.pageOf", { page, total: totalPages }) }}
          </span>
          <button
            type="button"
            class="px-3 py-1.5 text-sm rounded border border-gray-200 disabled:opacity-40"
            :disabled="page >= totalPages"
            @click="goToPage(page + 1)"
          >
            {{ t("news.next") }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
