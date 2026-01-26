import api from "./api";

export function getEmploymentTypes(params) {

  return api.get(`/employment_types`, {params});
  
}

// export function refreshToken(refreshToken) {
//   return api.post("/users/refresh-token", {
//     refreshToken,
//   });
// }

// export function register(payload) {
//   return api.post("/users/register", payload);
// }