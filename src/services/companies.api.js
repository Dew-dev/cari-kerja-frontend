import api from "./api";

function unwrap(res) {
  return res?.data?.data ?? res?.data ?? res;
}

/** Current company profile (+ vip / verification summary when BE sends it). */
export function getMyCompany() {
  return api.get("/companies/me").then(unwrap);
}

/** Update company settings (JSON or FormData for logo). */
export function updateMyCompany(payload, config = {}) {
  const isForm = typeof FormData !== "undefined" && payload instanceof FormData;
  return api.patch("/companies/me", payload, {
    ...config,
    ...(isForm ? { headers: { "Content-Type": "multipart/form-data", ...(config.headers || {}) } } : {}),
  }).then(unwrap);
}

/** Public company profile. */
export function getCompanyById(companyId) {
  return api.get(`/companies/${companyId}`).then(unwrap);
}

/** Public company directory (paginated). */
export function listCompanies(params = {}) {
  return api.get("/companies", { params });
}

/** Team members */
export function getCompanyMembers() {
  return api.get("/companies/me/members").then(unwrap);
}

export function updateCompanyMemberRole(userId, role) {
  return api.patch(`/companies/me/members/${userId}`, { role }).then(unwrap);
}

export function removeCompanyMember(userId) {
  return api.delete(`/companies/me/members/${userId}`).then(unwrap);
}

export function transferCompanyOwnership(newOwnerUserId) {
  return api
    .post("/companies/me/transfer-ownership", { new_owner_user_id: newOwnerUserId })
    .then(unwrap);
}

/** Invitations (manage) */
export function getCompanyInvitations() {
  return api.get("/companies/me/invitations").then(unwrap);
}

export function createCompanyInvitation({ email, role }) {
  return api.post("/companies/me/invitations", { email, role }).then(unwrap);
}

/** Pre-check invite email (blur / before submit). */
export function checkCompanyInvitationEmail(email) {
  return api
    .post("/companies/me/invitations/check-email", { email })
    .then(unwrap);
}

export function resendCompanyInvitation(invitationId) {
  return api.post(`/companies/me/invitations/${invitationId}/resend`).then(unwrap);
}

export function revokeCompanyInvitation(invitationId) {
  return api.delete(`/companies/me/invitations/${invitationId}`).then(unwrap);
}

/** Public invite flow */
export function previewCompanyInvitation(token) {
  return api.get("/companies/invitations/preview", { params: { token } }).then(unwrap);
}

export function acceptCompanyInvitation(token) {
  return api.post("/companies/invitations/accept", { token }).then(unwrap);
}
