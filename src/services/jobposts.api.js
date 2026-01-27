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
  const res = api.get(`/job_posts/${id}`);
  return res;
}
export const getRecruiterJobs = (params = {}) => {
  return api.get("/job-posts/self", { params });
};
// export function refreshToken(refreshToken) {
//   return api.post("/users/refresh-token", {
//     refreshToken,
//   });
// }

// export function register(payload) {
//   return api.post("/users/register", payload);
// }
