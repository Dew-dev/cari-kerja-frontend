import api from "./api";
const username = "testing123";
const pass = "testing123";
const basicHeader =
  username && pass ? `Basic ${btoa(`${username}:${pass}`)}` : undefined;

export function login(payload) {

  return api.post("/users/login", payload, {
    headers: {
      authorization: basicHeader,
    },
  });
}

export function refreshToken(refreshToken) {
  return api.post("/users/refresh-token", {
    refreshToken,
  });
}

export function register(payload) {
  return api.post("/users/register-worker", payload, {
    headers: {
      authorization: basicHeader,
    },
  });
}

export function registerRecruiter(payload) {
  return api.post("/users/register-recruiter", payload, {
    headers: {
      authorization: basicHeader,
    },
  });
}
