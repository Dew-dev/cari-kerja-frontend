/**
 * Multi-recruiter company helpers.
 * company_role: owner | admin | recruiter
 */

export const COMPANY_ROLES = Object.freeze({
  OWNER: "owner",
  ADMIN: "admin",
  RECRUITER: "recruiter",
});

const ROLE_RANK = {
  [COMPANY_ROLES.RECRUITER]: 1,
  [COMPANY_ROLES.ADMIN]: 2,
  [COMPANY_ROLES.OWNER]: 3,
};

export function normalizeCompanyRole(role) {
  const r = String(role || "").toLowerCase().trim();
  if (r === "owner" || r === "admin" || r === "recruiter") return r;
  return null;
}

export function companyRoleRank(role) {
  return ROLE_RANK[normalizeCompanyRole(role)] || 0;
}

/** Can assign/change to `targetRole` if actor rank > target rank (owner > admin > recruiter). */
export function canAssignRole(actorRole, targetRole) {
  const actor = normalizeCompanyRole(actorRole);
  const target = normalizeCompanyRole(targetRole);
  if (!actor || !target) return false;
  if (target === COMPANY_ROLES.OWNER) return actor === COMPANY_ROLES.OWNER;
  return companyRoleRank(actor) > companyRoleRank(target);
}

/**
 * Normalize recruiter session user from login/refresh/OAuth payload.
 * Keeps `id` as recruiter profile id for legacy URLs; adds company_* fields.
 */
export function normalizeRecruiterSessionUser(user = {}, previous = {}) {
  const roleId = Number(user.role_id ?? previous.role_id);
  const isRecruiter = roleId === 2 || user.role === "recruiter" || previous.role === "recruiter";

  const recruiterId =
    user.recruiter_id ??
    (isRecruiter ? user.id ?? previous.recruiter_id ?? previous.id : null) ??
    previous.recruiter_id;

  const userId = user.user_id ?? (isRecruiter ? user.id !== recruiterId ? user.id : previous.user_id : user.id) ?? previous.user_id;

  const companyId = user.company_id ?? previous.company_id ?? null;
  const companyRole =
    normalizeCompanyRole(user.company_role) ||
    normalizeCompanyRole(previous.company_role) ||
    (isRecruiter && companyId ? COMPANY_ROLES.OWNER : normalizeCompanyRole(previous.company_role));

  // Legacy single-recruiter: if BE belum kirim company_*, treat as owner of own company placeholder
  const resolvedCompanyRole =
    companyRole ||
    (isRecruiter ? COMPANY_ROLES.OWNER : null);

  return {
    ...previous,
    ...user,
    id: isRecruiter ? recruiterId : user.worker_id ?? user.id ?? previous.id,
    user_id: userId ?? previous.user_id,
    recruiter_id: isRecruiter ? recruiterId : previous.recruiter_id ?? null,
    company_id: companyId,
    company_role: isRecruiter ? resolvedCompanyRole : null,
    role: isRecruiter ? "recruiter" : Number(roleId) === 1 ? "user" : user.role || previous.role,
    role_id: roleId || previous.role_id,
  };
}

export function isCompanyOwner(role) {
  return normalizeCompanyRole(role) === COMPANY_ROLES.OWNER;
}

export function isCompanyAdmin(role) {
  const r = normalizeCompanyRole(role);
  return r === COMPANY_ROLES.OWNER || r === COMPANY_ROLES.ADMIN;
}
