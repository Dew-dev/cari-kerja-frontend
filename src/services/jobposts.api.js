import api from "./api";

export function getJobPosts(params) {
  return api.get(`/job-posts`, { params });
}

export function getJobPostsSelf(params) {
  const res = api.get(`/recruiters/job-posts/self`, { params });
  return res;
}

export const updateJob = (id, payload) => {
  return api.put(`/job-posts/${id}`, payload);
};
export function getJobPostById(id) {
  const res = api.get(`/job-posts/${id}`);
  return res;
}
export const getRecruiterJobs = (params = {}) => {
  return api.get("/job-posts/self", { params });
};

export function getJobPostRequirements(job_post_id) {
  return api.get(`/job-posts/job-post-requirements/${job_post_id}`);
}

export function getJobPostResponsibilities(job_post_id) {
  return api.get(`/job-posts/job-post-responsibilities/${job_post_id}`);
}

export function getJobPostBenefits(job_post_id) {
  return api.get(`/job-posts/job-post-benefits/${job_post_id}`);
}

// export function refreshToken(refreshToken) {
//   return api.post("/users/refresh-token", {
//     refreshToken,
//   });
// }

// export function register(payload) {
//   return api.post("/users/register", payload);
// }
