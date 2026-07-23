import api from "./api";

/**
 * Public news list (published only).
 * @param {{ page?: number, limit?: number, search?: string, category_slug?: string, featured?: boolean }} params
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
  return api.get("/news", { params: query });
}

export function getNewsBySlug(slug) {
  return api.get(`/news/${encodeURIComponent(slug)}`);
}

export function getNewsCategories() {
  return api.get("/news-categories");
}
