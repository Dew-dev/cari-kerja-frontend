import { defineStore } from "pinia";
import { login as loginApi } from "../services/auth.api";
import { refreshToken as refreshApi } from "../services/auth.api";
import { disconnectSocket } from "../composables/useSocket";

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
      disconnectSocket();
      this.token = null;
      this.refreshToken = null;
      this.user = null;

      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    },

    async refreshToken() {
      try {
        const res = await refreshApi();
        const { token, user } = res.data.data;

        this.token = token;
        localStorage.setItem("token", token);

        if (user) {
          const role =
            Number(user.role_id) === 2
              ? "recruiter"
              : Number(user.role_id) === 1
                ? "user"
                : this.user?.role;

          this.user = {
            ...(this.user || {}),
            id:
              Number(user.role_id) === 1
                ? user.worker_id
                : Number(user.role_id) === 2
                  ? user.recruiter_id
                  : user.id,
            user_id: user.user_id || user.id,
            name: user.name || this.user?.name,
            email: user.email || this.user?.email,
            avatar_url: user.avatar_url ?? this.user?.avatar_url,
            role,
          };
          localStorage.setItem("user", JSON.stringify(this.user));
        }

        return token;
      } catch (err) {
        this.logout();
        throw err;
      }
    },
  },
});
