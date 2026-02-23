import axios from "axios";
import { push } from "notivue";
import router from "../router";
import { useAuthStore } from "../stores/authStore";
import { i18n } from "../i18n";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1",
});

let isRefreshing = false;
let queue = [];
let hasShownSessionExpiredToast = false;

function logoutAndRedirectToLogin(auth, { notifySessionExpired = false } = {}) {
  auth.logout();

  if (notifySessionExpired && !hasShownSessionExpiredToast) {
    push.warning(i18n.global.t("notifications.sessionExpired"));
    hasShownSessionExpiredToast = true;
  }

  if (router.currentRoute.value.path !== "/login") {
    router.push("/login");
  }
}

function isSessionExpiredError(error) {
  const status = error?.response?.status;
  const message = String(error?.response?.data?.message || "").toLowerCase();
  const code = String(error?.response?.data?.code || "").toLowerCase();

  const sessionExpiredByStatus = [401, 419, 440].includes(status);
  const sessionExpiredByMessage =
    message.includes("session expired") ||
    message.includes("token expired") ||
    message.includes("jwt expired") ||
    code.includes("token_expired") ||
    code.includes("session_expired");

  return sessionExpiredByStatus && sessionExpiredByMessage;
}

function processQueue(error, token = null) {
  queue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  queue = [];
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const auth = useAuthStore();

    if (isSessionExpiredError(error)) {
      logoutAndRedirectToLogin(auth, { notifySessionExpired: true });
      return Promise.reject(error);
    }

    // 🚫 bukan 401 → lempar aja
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // 🚫 sudah retry → logout
    if (originalRequest._retry) {
      logoutAndRedirectToLogin(auth, { notifySessionExpired: true });
      return Promise.reject(error);
    }

    // 🧠 tandai retry
    originalRequest._retry = true;

    // 🔁 lagi refresh?
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    isRefreshing = true;

    try {
      const newToken = await auth.refreshToken();
      processQueue(null, newToken);

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (err) {
      processQueue(err, null);
      const shouldNotifySessionExpired = isSessionExpiredError(err) || err?.response?.status === 401;
      logoutAndRedirectToLogin(auth, {
        notifySessionExpired: shouldNotifySessionExpired,
      });
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
