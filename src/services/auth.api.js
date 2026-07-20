import api from "./api";
import { beginTelegramLinkIntent } from "../utils/oauthIntent";

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

/**
 * POST /auth/change-email — email untuk notifikasi (bukan ganti login provider).
 */
export function changeEmail(email) {
  return api.post("/auth/change-email", { email });
}

/**
 * POST /auth/link-telegram — hubungkan Telegram sebagai channel notifikasi.
 * Body: { code } dari OAuth Telegram (bukan flow login Telegram).
 */
export function linkTelegram(code) {
  return api.post("/auth/link-telegram", { code });
}

/**
 * Mulai OAuth Telegram untuk link notifikasi (bukan login).
 * Backup session agar jika OAuth salah masuk flow login, akun tidak diganti.
 */
export function startTelegramLinkOAuth() {
  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL ||
    `${import.meta.env.VITE_FILE_STORAGE_URL}/api/v1`;
  const origin = encodeURIComponent(window.location.origin);

  beginTelegramLinkIntent({
    token: localStorage.getItem("token"),
    refreshToken: localStorage.getItem("refreshToken"),
    user: JSON.parse(localStorage.getItem("user") || "null"),
  });

  window.location.href = `${apiBaseUrl}/users/telegram?purpose=link&origin=${origin}`;
}
