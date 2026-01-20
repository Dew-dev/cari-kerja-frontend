import api from "./api";

export function getJobPosts(filters) {

  return api.get(`/job-posts?${filters}`);
}

export function refreshToken(refreshToken) {
  return api.post("/users/refresh-token", {
    refreshToken,
  });
}

export function register(payload) {
  return api.post("/users/register", payload);
}