import api from "./api";

/**
 * Candidate Pipeline API service.
 *
 * NOTE: These endpoints are new and expected to be implemented by the backend
 * following the contract described in the "Instruksi untuk Agen Backend"
 * handoff. Until then, calls will fail with 404/501 — the store/UI handle
 * that gracefully (loading/error states) without crashing the page.
 */

// ── Candidates ───────────────────────────────────────────────────────────
export function getPipelineCandidates(params = {}) {
  return api.get("/recruiter/pipeline/candidates", { params });
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
