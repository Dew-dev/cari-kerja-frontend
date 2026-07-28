import api from "./api";

/** Locales supported by job category translations. */
export const CATEGORY_LOCALES = ["id", "en", "ru", "uz"];
export const CATEGORY_DEFAULT_LOCALE = "id";

/**
 * Map UI i18n locale → categories API locale (id | en | ru | uz).
 * Unsupported codes fall back to id (API default).
 */
export function resolveCategoryLocale(uiLocale) {
  const primary = String(uiLocale || CATEGORY_DEFAULT_LOCALE)
    .trim()
    .toLowerCase()
    .split(/[-_,]/)[0];
  if (CATEGORY_LOCALES.includes(primary)) return primary;
  return CATEGORY_DEFAULT_LOCALE;
}

/** True when API served a fallback translation. */
export function isCategoryLocaleFallback(item) {
  if (!item?.locale || !item?.locale_resolved) return false;
  return item.locale !== item.locale_resolved;
}

/**
 * Paginated category list (localized names).
 * @param {{ page?: number, limit?: number, search?: string, locale?: string }} params
 */
export function getCategories(params = {}) {
  const query = {
    page: params.page ?? 1,
    limit: params.limit ?? 50,
  };
  if (params.search) query.search = params.search;
  if (params.locale) query.locale = resolveCategoryLocale(params.locale);
  return api.get("/categories", { params: query });
}

/**
 * @param {number|string} id
 * @param {{ locale?: string }} [options]
 */
export function getCategoryById(id, options = {}) {
  const params = {};
  if (options.locale) params.locale = resolveCategoryLocale(options.locale);
  return api.get(`/categories/${encodeURIComponent(id)}`, { params });
}

/**
 * Categories with job counts (localized names).
 * @param {{ locale?: string }} [params]
 */
export function getCategoriesWithJobcount(params = {}) {
  const query = {};
  if (params.locale) query.locale = resolveCategoryLocale(params.locale);
  return api.get("/categories/jobcount", { params: query });
}
