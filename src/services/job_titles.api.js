import api from "./api";
import { resolveCategoryLocale } from "./categories.api";

/**
 * Autocomplete / lookup for canonical job titles.
 * @param {{ search?: string, page?: number, limit?: number, category_id?: number|string|null, locale?: string }} params
 */
export function getJobTitles(params = {}) {
  const query = {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  };
  if (params.search) query.search = params.search;
  if (
    params.category_id !== undefined &&
    params.category_id !== null &&
    params.category_id !== ""
  ) {
    query.category_id = params.category_id;
  }
  const uiLocale =
    params.locale != null && params.locale !== ""
      ? params.locale
      : typeof localStorage !== "undefined"
        ? localStorage.getItem("lang")
        : null;
  query.locale = resolveCategoryLocale(uiLocale);
  return api.get("/job-titles", { params: query });
}

export function getJobTitleById(id, options = {}) {
  const params = {};
  if (options.locale) params.locale = resolveCategoryLocale(options.locale);
  return api.get(`/job-titles/${encodeURIComponent(id)}`, { params });
}

/**
 * Best-effort match of a free-text title to a taxonomy row (first exact/prefix hit).
 * Used optionally when saving CV-parsed experiences.
 * @param {string} title
 * @param {{ category_id?: number|string|null, locale?: string }} [options]
 * @returns {Promise<{ id: string, name: string, slug: string, category_id?: number }|null>}
 */
export async function matchJobTitle(title, options = {}) {
  const q = String(title || "").trim();
  if (!q) return null;
  try {
    const res = await getJobTitles({
      search: q,
      page: 1,
      limit: 10,
      category_id: options.category_id,
      locale: options.locale,
    });
    const rows = res.data?.data || [];
    if (!rows.length) return null;
    const lower = q.toLowerCase();
    const exact = rows.find((r) => String(r.name || "").toLowerCase() === lower);
    return exact || rows[0] || null;
  } catch {
    return null;
  }
}
