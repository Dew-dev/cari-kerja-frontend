import api from './api'

// Get all workers with filters
export const searchWorkers = async (params = {}) => {
  try {
    const response = await api.get('/workers', { params })
    return response.data
  } catch (error) {
    console.error('Error searching workers:', error)
    throw error
  }
}

// Get worker by ID
export const getWorkerById = async (workerId) => {
  try {
    const response = await api.get(`/workers/${workerId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching worker:', error)
    throw error
  }
}

/**
 * Click-to-reveal worker contact (Bearer required).
 * GET /workers/:id/contact/email|telephone → { worker_id, field, value }
 */
export function revealWorkerContact(workerId, field) {
  const normalized = field === "telephone" || field === "phone" ? "telephone" : "email";
  return api.get(`/workers/${workerId}/contact/${normalized}`);
}

/**
 * Temporary signed URL for CV download/preview (~15 min).
 * GET /workers/resumes/:id/signed-url → { url, expires_in, resume_id }
 */
export function getResumeSignedUrl(resumeId) {
  return api.get(`/workers/resumes/${resumeId}/signed-url`);
}

// Get available filter options
export const getWorkerFilters = async () => {
  try {
    const response = await api.get('/workers/filters')
    return response.data
  } catch (error) {
    console.error('Error fetching worker filters:', error)
    throw error
  }
}

/** Job alert preference for the authenticated worker. */
export function getJobAlerts() {
  // → { enabled, has_email, telegram_available }
  // Alerts can be active when email or Telegram is linked.
  return api.get("/workers/me/job-alerts");
}

export function updateJobAlerts(payload) {
  // { enabled: boolean } — request contract unchanged
  return api.put("/workers/me/job-alerts", payload);
}
