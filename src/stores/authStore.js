import { defineStore } from "pinia";
import { login as loginApi } from "@/services/auth.api";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("token"),
    refreshToken: localStorage.getItem("refreshToken"),
    user: JSON.parse(localStorage.getItem("user")),
    loading: false,
    error: null,
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
        this.error = err.response?.data?.message || "Login failed";
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
  },
});
