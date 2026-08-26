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

/** Legacy single-recruiter account without multi-company claims from BE. */
export function isLegacyRecruiterAccount(user) {
  if (!user || user.role !== "recruiter") return false;
  return !user.company_id && !normalizeCompanyRole(user.company_role);
}

/** BE sent company_id but role is not resolved yet — deny elevated permissions until refresh. */
export function isCompanyRolePending(user) {
  if (!user || user.role !== "recruiter") return false;
  return Boolean(user.company_id) && !normalizeCompanyRole(user.company_role);
}

export function recruiterCanManageBilling(user) {
  if (user?.role !== "recruiter") return false;
  if (isLegacyRecruiterAccount(user)) return true;
  if (isCompanyRolePending(user)) return false;
  return isCompanyOwner(user.company_role);
}

export function recruiterCanManageTeam(user) {
  if (user?.role !== "recruiter") return false;
  if (isLegacyRecruiterAccount(user)) return true;
  if (isCompanyRolePending(user)) return false;
  return isCompanyAdmin(user.company_role);
}

export function recruiterCanEditCompany(user) {
  return recruiterCanManageTeam(user);
}

export function recruiterCanManageVerification(user) {
  return recruiterCanManageTeam(user);
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

  const userId =
    user.user_id ??
    (isRecruiter ? (user.id !== recruiterId ? user.id : previous.user_id) : user.id) ??
    previous.user_id;

  const companyId = user.company_id ?? previous.company_id ?? null;
  const explicitRole =
    normalizeCompanyRole(user.company_role) ||
    normalizeCompanyRole(previous.company_role);

  // Legacy single-recruiter (no company_id): default owner.
  // Multi-recruiter with company_id but missing role: leave null until BE resolves.
  const resolvedCompanyRole =
    explicitRole ?? (isRecruiter && !companyId ? COMPANY_ROLES.OWNER : null);

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
