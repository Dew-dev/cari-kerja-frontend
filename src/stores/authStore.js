import { defineStore } from "pinia";
import { i18n } from "../i18n";
import { login as loginApi } from "../services/auth.api";
import { refreshToken as refreshApi } from "../services/auth.api";
import { disconnectSocket } from "../composables/useSocket";
import { decodeAccessToken } from "../utils/jwt";
import { isTelegramPlaceholderEmail } from "../utils/authFlags";
import { isCaptchaError, isRateLimitedError } from "../utils/apiErrors";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("token"),
    refreshToken: localStorage.getItem("refreshToken"),
    user: JSON.parse(localStorage.getItem("user")),
    loading: false,
    error: null,
    needVerifyEmail: false,
    /** Setelah beberapa gagal login, BE meminta Turnstile (CAPTCHA_REQUIRED / INVALID). */
    captchaRequired: false,
    lastLoginEmail: null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    role: (state) => state.user?.role,
    loginProvider: (state) => {
      const fromUser = state.user?.login_provider;
      if (fromUser) return fromUser;
      const decoded = decodeAccessToken(state.token);
      return decoded?.login_provider || "local";
    },
  },

  actions: {
    mergeUser(partial) {
      this.user = { ...(this.user || {}), ...partial };
      localStorage.setItem("user", JSON.stringify(this.user));
    },

    async login(payload) {
      this.loading = true;
      this.error = null;
      this.needVerifyEmail = false;

      try {
        const res = await loginApi(payload);
        const data = res.data.data;
        const { token, refreshToken, user } = data;

        this.token = token;
        this.refreshToken = refreshToken;
        this.user = {
          ...user,
          login_provider:
            user?.login_provider ||
            decodeAccessToken(token)?.login_provider ||
            "local",
        };

        localStorage.setItem("token", token);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(this.user));

        this.captchaRequired = false;

        return true;
      } catch (err) {
        console.error("Login error:", err);
        const msg = err?.response?.data?.message;

        if (isCaptchaError(err)) {
          this.captchaRequired = true;
          this.error = i18n.global.t("captcha.required");
          return false;
        }

        if (isRateLimitedError(err)) {
          this.error = i18n.global.t("captcha.rateLimited");
          return false;
        }

        // 403 suspended → tampilkan pesan yang diterjemahkan di banner login
        if (
          err?.response?.status === 403 &&
          String(msg || "").toLowerCase().includes("suspended")
        ) {
          this.error = i18n.global.t("notifications.accountSuspended");
          return false;
        }

        if (msg === "Email not verified") {
          this.error = null;
          this.needVerifyEmail = true;
          this.lastLoginEmail = payload.email;
          return false;
        }

        this.error = msg || "Invalid email or password";
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
      this.captchaRequired = false;
      this.needVerifyEmail = false;

      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("notificationChannelFlags");
    },

    async refreshToken({ logoutOnFail = true } = {}) {
      try {
        const res = await refreshApi();
        const payload = res.data.data;
        const { token, user, refreshToken: newRefreshToken } = payload;

        this.token = token;
        localStorage.setItem("token", token);

        if (newRefreshToken) {
          this.$patch({ refreshToken: newRefreshToken });
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        if (user) {
          const role =
            Number(user.role_id) === 2
              ? "recruiter"
              : Number(user.role_id) === 1
                ? "user"
                : this.user?.role;

          const email =
            isTelegramPlaceholderEmail(user.email) ? "" : user.email;

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
            email: email || this.user?.email || "",
            avatar_url: user.avatar_url ?? this.user?.avatar_url,
            role,
            login_provider:
              user.login_provider ||
              decodeAccessToken(token)?.login_provider ||
              this.user?.login_provider,
          };
          localStorage.setItem("user", JSON.stringify(this.user));
        }

        return token;
      } catch (err) {
        if (logoutOnFail) {
          this.logout();
        }
        throw err;
      }
    },
  },
});
