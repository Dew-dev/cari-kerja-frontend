import api from "./api";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isSavedJobId(value) {
  return typeof value === "string" && UUID_RE.test(value);
}

/**
 * POST /saved-jobs/:job_post_id
 * Path param = job_post id. worker_id diambil dari token di backend.
 * Response data: { id: saved_job_id, job_post_id, worker_id }
 */
export async function saveJob(jobPostId) {
  const res = await api.post(
    `/saved-jobs/${jobPostId}`,
    {},
    { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
  );
  return res.data;
}

/**
 * DELETE /saved-jobs/:id
 * Path param = saved_jobs.id (bukan job_post_id).
 * worker_id diambil dari token di backend.
 */
export async function removeSavedJob(savedJobId) {
  const res = await api.delete(`/saved-jobs/${savedJobId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return res.data;
}

/**
 * Hapus saved job berdasarkan job_post_id.
 * Dipakai saat UI hanya punya job_post_id (mis. job detail mengembalikan boolean, bukan UUID).
 */
export async function removeSavedJobByJobPostId(jobPostId) {
  const listRes = await getSavedJobs();
  const list = Array.isArray(listRes?.data) ? listRes.data : [];
  const found = list.find((item) => item.job_post_id === jobPostId);
  if (!found?.id) return null;
  return removeSavedJob(found.id);
}

/**
 * GET /workers/saved-jobs/self
 * worker_id dari token. Setiap item: id = saved_job_id, job_post_id = job post.
 */
export async function getSavedJobs(params = {}) {
  const res = await api.get(`/workers/saved-jobs/self`, {
    params: {
      page: 1,
      limit: 100,
      ...params,
    },
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return res.data;
}

/**
 * GET /saved-jobs/:id
 * Path param = saved_jobs.id (bukan job_post_id).
 */
export async function getSavedJobById(savedJobId) {
  const res = await api.get(`/saved-jobs/${savedJobId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return res.data;
}
