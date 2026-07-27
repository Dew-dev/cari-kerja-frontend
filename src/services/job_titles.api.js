import api from "./api";

/**
 * Autocomplete / lookup for canonical job titles.
 * @param {{ search?: string, page?: number, limit?: number }} params
 */
export function getJobTitles(params = {}) {
  const query = {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  };
  if (params.search) query.search = params.search;
  return api.get("/job-titles", { params: query });
}

export function getJobTitleById(id) {
  return api.get(`/job-titles/${encodeURIComponent(id)}`);
}

/**
 * Best-effort match of a free-text title to a taxonomy row (first exact/prefix hit).
 * Used optionally when saving CV-parsed experiences.
 * @param {string} title
 * @returns {Promise<{ id: string, name: string, slug: string }|null>}
 */
export async function matchJobTitle(title) {
  const q = String(title || "").trim();
  if (!q) return null;
  try {
    const res = await getJobTitles({ search: q, page: 1, limit: 10 });
    const rows = res.data?.data || [];
    if (!rows.length) return null;
    const lower = q.toLowerCase();
    const exact = rows.find((r) => String(r.name || "").toLowerCase() === lower);
    return exact || rows[0] || null;
  } catch {
    return null;
  }
}
