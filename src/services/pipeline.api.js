import api from "./api";

/**
 * Candidate Pipeline API service.
 *
 * Backed by the `candidate_pipeline` module (see `018_candidate_pipeline.sql`
 * migration): per-job-post customizable stages, cross-job pipeline board,
 * stage-distribution analytics and application activity timeline.
 */

// ── Candidates ───────────────────────────────────────────────────────────
/**
 * @param {object} params
 * @param {string} [params.job_post_id]
 * @param {string} [params.search]
 * @param {string} [params.stage_type]
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @param {'match_score'|'updated_at'|'applied_at'} [params.sort]
 * @param {'asc'|'desc'} [params.order]
 * @param {number} [params.min_match_score]
 */
export function getPipelineCandidates(params = {}) {
  return api.get("/recruiter/pipeline/candidates", { params });
}

/** Optional detail endpoint for a single application's AI match payload. */
export function getApplicationMatch(applicationId) {
  return api.get(`/job-applications/${applicationId}/match`);
}

/** Enqueue recompute of AI match scores for all applicants on a job post. */
export function rematchJobPost(jobPostId) {
  return api.post(`/job-posts/${jobPostId}/rematch`);
}

/**
 * Legacy applicants list for a single job post. Used as a fallback when the
 * dedicated pipeline candidates endpoint is not yet available on the API host.
 */
export function getJobApplicants(jobPostId) {
  return api.get(`/job-posts/${jobPostId}/applicants`);
}

// ── Analytics ─────────────────────────────────────────────────────────────
export function getPipelineAnalytics(params = {}) {
  return api.get("/recruiter/pipeline/analytics", { params });
}

// ── Job posts (for the "posisi" filter dropdown) ──────────────────────────
export function getRecruiterJobPosts(params = {}) {
  return api.get("/job-posts/self", { params });
}

// ── Stages CRUD (scoped per job post) ─────────────────────────────────────
export function getJobStages(jobPostId) {
  return api.get(`/job-posts/${jobPostId}/stages`);
}

export function createJobStage(jobPostId, payload) {
  return api.post(`/job-posts/${jobPostId}/stages`, payload);
}

export function updateJobStage(jobPostId, stageId, payload) {
  return api.put(`/job-posts/${jobPostId}/stages/${stageId}`, payload);
}

export function reorderJobStages(jobPostId, stages) {
  // stages: [{ id, position }]
  return api.put(`/job-posts/${jobPostId}/stages/reorder`, { stages });
}

export function deleteJobStage(jobPostId, stageId) {
  return api.delete(`/job-posts/${jobPostId}/stages/${stageId}`);
}

// ── Candidate stage transition ─────────────────────────────────────────────
export function moveApplicationStage(applicationId, stageId) {
  return api.put(`/job-applications/${applicationId}/status`, {
    application_status_id: stageId,
  });
}

// ── Candidate activity timeline ────────────────────────────────────────────
export function getApplicationTimeline(applicationId) {
  return api.get(`/job-applications/${applicationId}/timeline`);
}

// ── Notes (feedback) — reuses the existing notes endpoints ────────────────
export function getApplicationNotes(applicationId) {
  return api.get(`/job-applications/${applicationId}/notes`);
}

export function addApplicationNote(applicationId, note) {
  return api.post(`/job-applications/${applicationId}/notes`, { note });
}
