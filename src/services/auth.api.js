import api from "./api";

const username = "testing123";
const pass = "testing123";
export const basicAuthHeader =
  username && pass ? `Basic ${btoa(`${username}:${pass}`)}` : undefined;

export function login(payload) {
  return api.post("/users/login", payload, {
    headers: {
      authorization: basicAuthHeader,
    },
  });
}

/**
 * Backend: PUT /users/refresh-token (basic auth).
 * Prefer cookie; juga kirim refreshToken dari localStorage (OAuth cross-origin).
 */
export function refreshToken() {
  const storedRefreshToken = localStorage.getItem("refreshToken");
  return api.put(
    "/users/refresh-token",
    storedRefreshToken ? { refreshToken: storedRefreshToken } : {},
    {
      headers: {
        authorization: basicAuthHeader,
      },
    },
  );
}

export function register(payload) {
  return api.post("/users/register-worker", payload, {
    headers: {
      authorization: basicAuthHeader,
    },
  });
}

export function registerRecruiter(payload) {
  return api.post("/users/register-recruiter", payload, {
    headers: {
      authorization: basicAuthHeader,
    },
  });
}

export function logout() {
  const token = localStorage.getItem("token");
  const headers = {};
  if (token && token !== "google-cookie-session") {
    headers.Authorization = `Bearer ${token}`;
  }
  return api.post("/users/logout", {}, { headers });
}
