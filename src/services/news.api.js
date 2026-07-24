import api from "./api";

/** Locales supported by the news translation API. */
export const NEWS_LOCALES = ["id", "en"];

/**
 * Map UI i18n locale → news API locale (id | en).
 * Non-supported UI locales (uz, ru, …) prefer English content.
 */
export function resolveNewsLocale(uiLocale) {
  const primary = String(uiLocale || "id")
    .trim()
    .toLowerCase()
    .split(/[-_,]/)[0];
  if (NEWS_LOCALES.includes(primary)) return primary;
  return "en";
}

/** True when API served a fallback translation. */
export function isNewsLocaleFallback(item) {
  if (!item?.locale || !item?.locale_resolved) return false;
  return item.locale !== item.locale_resolved;
}

/**
 * Public news list (published only).
 * @param {{ page?: number, limit?: number, search?: string, category_slug?: string, featured?: boolean, locale?: string }} params
 */
export function getNews(params = {}) {
  const query = {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
  };
  if (params.search) query.search = params.search;
  if (params.category_slug) query.category_slug = params.category_slug;
  if (params.featured === true || params.featured === "true") {
    query.featured = true;
  }
  if (params.locale) query.locale = resolveNewsLocale(params.locale);
  return api.get("/news", { params: query });
}

/**
 * @param {string} slug
 * @param {{ locale?: string }} [options]
 */
export function getNewsBySlug(slug, options = {}) {
  const params = {};
  if (options.locale) params.locale = resolveNewsLocale(options.locale);
  return api.get(`/news/${encodeURIComponent(slug)}`, { params });
}

/**
 * @param {{ locale?: string }} [params]
 */
export function getNewsCategories(params = {}) {
  const query = {};
  if (params.locale) query.locale = resolveNewsLocale(params.locale);
  return api.get("/news-categories", { params: query });
}
