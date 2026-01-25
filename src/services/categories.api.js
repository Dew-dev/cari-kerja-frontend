import api from "./api";

export function getCategoriesWithJobcount(params) {

  return api.get(`/categories/jobcount`, {params});
  
}

export function refreshToken(refreshToken) {
  return api.post("/users/refresh-token", {
    refreshToken,
  });
}

export function register(payload) {
  return api.post("/users/register", payload);
}