import api from "./api";

/**
 * Bulk Communication API (recruiter email campaigns + worker preferences).
 *
 * Merge fields in subject/body: {{candidate_name}}, {{job_title}}
 */

// ── Templates ─────────────────────────────────────────────────────────────
export function getCommunicationTemplates() {
  return api.get("/recruiter/communication/templates");
}

export function createCommunicationTemplate(payload) {
  // { name, subject, body, channel?: "email" }
  return api.post("/recruiter/communication/templates", payload);
}

export function updateCommunicationTemplate(id, payload) {
  return api.put(`/recruiter/communication/templates/${id}`, payload);
}

export function deleteCommunicationTemplate(id) {
  return api.delete(`/recruiter/communication/templates/${id}`);
}

// ── Bulk send ─────────────────────────────────────────────────────────────
export function bulkSendCommunication(payload) {
  // {
  //   channel: "email",
  //   template_id?: string,
  //   subject: string,
  //   body: string,
  //   application_ids: string[],
  //   job_post_id?: string
  // }
  return api.post("/recruiter/communication/bulk-send", payload);
}

// ── Campaigns / history ───────────────────────────────────────────────────
export function getCommunicationCampaigns(params = {}) {
  return api.get("/recruiter/communication/campaigns", { params });
}

export function getCommunicationCampaign(id) {
  return api.get(`/recruiter/communication/campaigns/${id}`);
}

// ── Worker preferences (GDPR opt-out) ─────────────────────────────────────
export function getCommunicationPreferences() {
  return api.get("/workers/me/communication-preferences");
}

export function updateCommunicationPreferences(payload) {
  // { email_opt_out: boolean }
  return api.put("/workers/me/communication-preferences", payload);
}

// ── Public unsubscribe (GDPR) ─────────────────────────────────────────────
export function unsubscribeByToken(token) {
  return api.get(`/communication/unsubscribe/${token}`);
}
