import api from "./api";
import { resolveCategoryLocale } from "./categories.api";

/**
 * Attach UI locale so category_name (and related labels) match the active language.
 * Callers may override with an explicit `locale` param.
 */
function withLocale(params = {}) {
  const next = { ...(params || {}) };
  const uiLocale =
    next.locale != null && next.locale !== ""
      ? next.locale
      : typeof localStorage !== "undefined"
        ? localStorage.getItem("lang")
        : null;
  next.locale = resolveCategoryLocale(uiLocale);
  return next;
}

export function getJobPosts(params) {
  return api.get(`/job-posts`, { params: withLocale(params) });
}

export function getHotJobPosts(params) {
  return api.get(`/job-posts/hot`, { params: withLocale(params) });
}

export function getJobPostsSelf(params) {
  const res = api.get(`/recruiters/job-posts/self`, { params: withLocale(params) });
  return res;
}

export const updateJob = (id, payload) => {
  return api.put(`/job-posts/${id}`, payload);
};

export function getJobPostById(id, params = {}) {
  return api.get(`/job-posts/${id}`, { params: withLocale(params) });
}

export const getRecruiterJobs = (params = {}) => {
  return api.get("/job-posts/self", { params: withLocale(params) });
};

export function getJobPostRequirements(job_post_id) {
  return api.get(`/job-posts/job-post-requirements/${job_post_id}`);
}

export function getJobPostResponsibilities(job_post_id) {
  return api.get(`/job-posts/job-post-responsibilities/${job_post_id}`);
}

export function getJobPostBenefits(job_post_id) {
  return api.get(`/job-posts/job-post-benefits/${job_post_id}`);
}
