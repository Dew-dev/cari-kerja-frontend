import api from "./api";
import { useAuthStore } from "../stores/authStore";
import { tokenNeedsWorkerContext } from "../utils/jwt";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isSavedJobId(value) {
  return typeof value === "string" && UUID_RE.test(value);
}

async function ensureWorkerAuthContext() {
  const auth = useAuthStore();
  const token = auth.token || localStorage.getItem("token");

  if (!tokenNeedsWorkerContext(token)) return;

  await auth.refreshToken();
}

/**
 * POST /saved-jobs/:job_post_id
 * Path param = job_post id. worker_id diambil dari token di backend.
 */
export async function saveJob(jobPostId) {
  await ensureWorkerAuthContext();
  const res = await api.post(`/saved-jobs/${jobPostId}`, {});
  return res.data;
}

/**
 * DELETE /saved-jobs/:id
 * Path param = saved_jobs.id (bukan job_post_id).
 */
export async function removeSavedJob(savedJobId) {
  await ensureWorkerAuthContext();
  const res = await api.delete(`/saved-jobs/${savedJobId}`);
  return res.data;
}

/**
 * Hapus saved job berdasarkan job_post_id.
 */
export async function removeSavedJobByJobPostId(jobPostId) {
  await ensureWorkerAuthContext();
  const listRes = await getSavedJobs();
  const list = Array.isArray(listRes?.data) ? listRes.data : [];
  const found = list.find((item) => item.job_post_id === jobPostId);
  if (!found?.id) return null;
  return removeSavedJob(found.id);
}

/**
 * GET /workers/saved-jobs/self
 * worker_id dari token.
 */
export async function getSavedJobs(params = {}) {
  await ensureWorkerAuthContext();
  const res = await api.get(`/workers/saved-jobs/self`, {
    params: {
      page: 1,
      limit: 100,
      ...params,
    },
  });
  return res.data;
}

/**
 * GET /saved-jobs/:id
 * Path param = saved_jobs.id (bukan job_post_id).
 */
export async function getSavedJobById(savedJobId) {
  await ensureWorkerAuthContext();
  const res = await api.get(`/saved-jobs/${savedJobId}`);
  return res.data;
}
