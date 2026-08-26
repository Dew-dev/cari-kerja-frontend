import api from "./api";

function unwrap(res) {
  return res?.data?.data ?? res?.data ?? res;
}

export const getRecruitersGroupedByIndustry = async (params = {}) => {
  try {
    const response = await api.get("/recruiters/grouped-by-industry", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching recruiters grouped by industry:", error);
    throw error;
  }
};

export const getRecruiterCompanies = async (params = {}) => {
  try {
    // Prefer new directory; fall back to legacy path
    try {
      return await api.get("/companies", { params });
    } catch (err) {
      if (err?.response?.status !== 404) throw err;
      return await api.get("/recruiters/companies", { params });
    }
  } catch (error) {
    console.error("Error fetching recruiter companies:", error);
    throw error;
  }
};

/** Personal recruiter profile (PIC), not company. */
export function getMyRecruiterProfile() {
  return api.get("/recruiters/me").then(unwrap);
}

export function updateMyRecruiterProfile(payload, config = {}) {
  const isForm = typeof FormData !== "undefined" && payload instanceof FormData;
  return api.patch("/recruiters/me", payload, {
    ...config,
    ...(isForm ? { headers: { "Content-Type": "multipart/form-data", ...(config.headers || {}) } } : {}),
  }).then(unwrap);
}

/** Legacy/public: load recruiter profile by user id or recruiter profile id. */
export function getRecruiterByUserId(userOrRecruiterId) {
  return api.get(`/users/${userOrRecruiterId}/recruiters`).then(unwrap);
}

/** @deprecated Use getRecruiterByUserId — BE accepts user_id or recruiter profile id. */
export function getRecruiterByProfileId(recruiterId) {
  return getRecruiterByUserId(recruiterId);
}
