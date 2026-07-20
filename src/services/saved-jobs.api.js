import api from "./api";
import { useAuthStore } from "../stores/authStore";
import { tokenNeedsWorkerContext } from "../utils/jwt";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SAVED_JOB_ID_CACHE_KEY = "saved_job_id_by_job_post";

export function isSavedJobId(value) {
  return typeof value === "string" && UUID_RE.test(value);
}

function readSavedJobIdCache() {
  try {
    const raw = sessionStorage.getItem(SAVED_JOB_ID_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeSavedJobIdCache(cache) {
  sessionStorage.setItem(SAVED_JOB_ID_CACHE_KEY, JSON.stringify(cache));
}

export function rememberSavedJobId(jobPostId, savedJobId) {
  if (!jobPostId || !isSavedJobId(savedJobId)) return;
  const cache = readSavedJobIdCache();
  cache[String(jobPostId)] = savedJobId;
  writeSavedJobIdCache(cache);
}

export function recallSavedJobId(jobPostId) {
  if (!jobPostId) return null;
  const cached = readSavedJobIdCache()[String(jobPostId)];
  return isSavedJobId(cached) ? cached : null;
}

export function forgetSavedJobId(jobPostId) {
  if (!jobPostId) return;
  const cache = readSavedJobIdCache();
  delete cache[String(jobPostId)];
  writeSavedJobIdCache(cache);
}

/**
 * OAuth JWT kadang tanpa worker_id. Refresh mengisi ulang.
 * Soft: gagal refresh tidak logout (cookie cross-origin sering absen).
 */
async function ensureWorkerAuthContext() {
  const auth = useAuthStore();
  const token = auth.token || localStorage.getItem("token");

  if (!tokenNeedsWorkerContext(token)) return;

  try {
    await auth.refreshToken({ logoutOnFail: false });
  } catch (error) {
    console.warn("Could not refresh worker_id into access token:", error);
  }
}

/**
 * POST /saved-jobs/:job_post_id
 * Path param = job_post id. worker_id dari JWT.
 */
export async function saveJob(jobPostId) {
  await ensureWorkerAuthContext();
  const res = await api.post(`/saved-jobs/${jobPostId}`, {});
  const savedJobId = res.data?.data?.id;
  if (savedJobId) {
    rememberSavedJobId(jobPostId, savedJobId);
  }
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
 * Unsave: selalu DELETE /saved-jobs/:savedJobId.
 * Urutan resolve id: argumen → cache session → (last resort) GET self.
 */
export async function unsaveJob({ savedJobId = null, jobPostId = null } = {}) {
  await ensureWorkerAuthContext();

  let id = isSavedJobId(savedJobId) ? savedJobId : null;
  if (!id) id = recallSavedJobId(jobPostId);

  if (!id && jobPostId) {
    id = await findSavedJobIdByJobPostId(jobPostId);
  }

  if (!id) {
    const err = new Error("SAVED_JOB_ID_MISSING");
    err.code = "SAVED_JOB_ID_MISSING";
    throw err;
  }

  const result = await removeSavedJob(id);
  forgetSavedJobId(jobPostId);
  return result;
}

async function findSavedJobIdByJobPostId(jobPostId) {
  try {
    const listRes = await getSavedJobs();
    const list = Array.isArray(listRes?.data) ? listRes.data : [];
    const found = list.find((item) => item.job_post_id === jobPostId);
    if (found?.id) {
      rememberSavedJobId(jobPostId, found.id);
      return found.id;
    }
  } catch (error) {
    console.warn("Lookup saved job id via GET self failed:", error);
  }
  return null;
}

/** @deprecated pakai unsaveJob — jangan GET self dulu untuk unsave */
export async function removeSavedJobByJobPostId(jobPostId) {
  return unsaveJob({ jobPostId });
}

/**
 * GET /workers/saved-jobs/self
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

  const body = res.data;
  // Backend kadang 200 + success:false saat list kosong / join gagal
  if (body && body.success === false) {
    const message = body.message;
    const text =
      typeof message === "string"
        ? message
        : message?.message || "Failed to load saved jobs";
    const err = new Error(text);
    err.response = { status: body.code || 404, data: body };
    throw err;
  }

  const list = Array.isArray(body?.data) ? body.data : [];
  for (const item of list) {
    if (item?.job_post_id && item?.id) {
      rememberSavedJobId(item.job_post_id, item.id);
    }
  }

  return body;
}

/**
 * GET /saved-jobs/:id
 */
export async function getSavedJobById(savedJobId) {
  await ensureWorkerAuthContext();
  const res = await api.get(`/saved-jobs/${savedJobId}`);
  return res.data;
}
