import api from "./api";

/**
 * Autocomplete / lookup for canonical job titles.
 * @param {{ search?: string, page?: number, limit?: number, category_id?: number|string|null }} params
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
  return api.get("/job-titles", { params: query });
}

export function getJobTitleById(id) {
  return api.get(`/job-titles/${encodeURIComponent(id)}`);
}

/**
 * Best-effort match of a free-text title to a taxonomy row (first exact/prefix hit).
 * Used optionally when saving CV-parsed experiences.
 * @param {string} title
 * @param {{ category_id?: number|string|null }} [options]
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
