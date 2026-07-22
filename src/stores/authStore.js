import { defineStore } from "pinia";
import { i18n } from "../i18n";
import { login as loginApi } from "../services/auth.api";
import { refreshToken as refreshApi } from "../services/auth.api";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("token"),
    refreshToken: localStorage.getItem("refreshToken"),
    user: JSON.parse(localStorage.getItem("user")),
    loading: false,
    error: null,
    needVerifyEmail: false,
    lastLoginEmail: null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    role: (state) => state.user?.role,
  },

  actions: {
    async login(payload) {
      this.loading = true;
      this.error = null;

      try {
        const res = await loginApi(payload);

        const { token, refreshToken, user } = res.data.data;

        this.token = token;
        this.refreshToken = refreshToken;
        this.user = user;

        localStorage.setItem("token", token);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(user));

        return true;
      } catch (err) {
        console.error("Login error:", err);
        const msg = err?.response?.data?.message;

        // 403 suspended → tampilkan pesan yang diterjemahkan di banner login
        if (
          err?.response?.status === 403 &&
          String(msg || "").toLowerCase().includes("suspended")
        ) {
          this.error = i18n.global.t("notifications.accountSuspended");
          return false;
        }

        if (msg === "Email not verified") {
          this.error = "Please verify your email before logging in.";
          this.needVerifyEmail = true;
          this.lastLoginEmail = payload.email;
        } else {
          this.error = "Invalid email or password";
        }

        this.error = msg || "Login failed";
        return false;
      } finally {
        this.loading = false;
      }
    },

    logout() {
      this.token = null;
      this.refreshToken = null;
      this.user = null;

      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    },

    async refreshToken() {
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        const res = await refreshApi(refreshToken);

        const { token, refreshToken: newRefreshToken } = res.data.data;

        this.token = token;
        this.refreshToken = newRefreshToken;

        localStorage.setItem("token", token);
        localStorage.setItem("refreshToken", newRefreshToken);

        return token;
      } catch (err) {
        this.logout();
        throw err;
      }
    },
  },
});
