<template>
  <section class="bg-white py-16">
    <div class="max-w-290 mx-auto px-4">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
        <div>
          <h2 class="text-3xl font-bold text-gray-800 mb-2">
            {{ t("news.highlightTitle") }}
          </h2>
          <p class="text-gray-600">
            {{ t("news.highlightSubtitle") }}
          </p>
        </div>
        <router-link
          :to="{ name: 'news' }"
          class="inline-flex items-center self-start sm:self-auto text-blue-600 hover:text-blue-700 font-semibold text-sm"
        >
          {{ t("news.viewAll") }} →
        </router-link>
      </div>

      <div v-if="loading" class="text-center py-12 text-gray-600 text-sm">
        {{ t("news.loading") }}
      </div>

      <div
        v-else-if="!items.length"
        class="text-center py-12"
      >
        <p class="text-gray-600 mb-4 text-sm">{{ t("news.empty") }}</p>
        <router-link
          :to="{ name: 'news' }"
          class="inline-flex bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition text-sm"
        >
          {{ t("news.viewAll") }}
        </router-link>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <router-link
          v-for="item in items"
          :key="item.id"
          :to="{ name: 'news-detail', params: { slug: item.slug } }"
          class="group flex flex-col rounded-xl border border-gray-200 bg-gray-50 overflow-hidden hover:shadow-lg hover:border-blue-300 hover:bg-blue-50/40 transition duration-300"
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
          <div class="p-5 flex flex-col grow gap-2">
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
                class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium"
              >
                {{ item.category_name }}
              </span>
              <span class="text-gray-400">{{ formatDate(item.published_at) }}</span>
            </div>
            <h3 class="text-lg font-bold text-gray-800 group-hover:text-blue-600 line-clamp-2">
              {{ item.title }}
            </h3>
            <p class="text-sm text-gray-600 line-clamp-2 grow">
              {{ item.excerpt }}
            </p>
            <span class="text-sm font-medium text-blue-600 mt-1">
              {{ t("news.readMore") }} →
            </span>
          </div>
        </router-link>
      </div>

      <div v-if="items.length" class="text-center mt-10">
        <router-link
          :to="{ name: 'news' }"
          class="inline-flex bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition text-sm"
        >
          {{ t("news.viewAll") }} →
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  getNews,
  isNewsLocaleFallback,
  resolveNewsLocale,
} from "@/services/news.api";

const { t, locale } = useI18n();

const items = ref([]);
const loading = ref(true);

const fileStorageUrl = import.meta.env.VITE_FILE_STORAGE_URL || "";

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

async function loadLatest() {
  loading.value = true;
  try {
    const res = await getNews({
      page: 1,
      limit: 3,
      locale: resolveNewsLocale(locale.value),
    });
    items.value = res.data?.data || [];
  } catch (error) {
    console.error("Failed to load news highlight:", error);
    items.value = [];
  } finally {
    loading.value = false;
  }
}

watch(locale, loadLatest);
onMounted(loadLatest);
</script>
