import { defineStore } from "pinia";
import { i18n } from "../i18n";
import { login as loginApi } from "../services/auth.api";
import { refreshToken as refreshApi } from "../services/auth.api";
import { disconnectSocket } from "../composables/useSocket";
import { decodeAccessToken } from "../utils/jwt";
import { isFlagTruthy, isTelegramPlaceholderEmail } from "../utils/authFlags";
import { isCaptchaError, isRateLimitedError } from "../utils/apiErrors";

const FLAGS_KEY = "notificationChannelFlags";

function readStoredFlags() {
  try {
    return JSON.parse(localStorage.getItem(FLAGS_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function writeStoredFlags(flags) {
  localStorage.setItem(FLAGS_KEY, JSON.stringify(flags));
}

export const useAuthStore = defineStore("auth", {
  state: () => {
    const flags = readStoredFlags();
    return {
      token: localStorage.getItem("token"),
      refreshToken: localStorage.getItem("refreshToken"),
      user: JSON.parse(localStorage.getItem("user")),
      loading: false,
      error: null,
      needVerifyEmail: false,
      /** Setelah beberapa gagal login, BE meminta Turnstile (CAPTCHA_REQUIRED / INVALID). */
      captchaRequired: false,
      lastLoginEmail: null,
      requiresEmailSetup: Boolean(flags.requiresEmailSetup),
      requiresTelegramLink: Boolean(flags.requiresTelegramLink),
      dismissedEmailBanner: Boolean(flags.dismissedEmailBanner),
      dismissedTelegramBanner: Boolean(flags.dismissedTelegramBanner),
    };
  },

  getters: {
    isLoggedIn: (state) => !!state.token,
    role: (state) => state.user?.role,
    loginProvider: (state) => {
      const fromUser = state.user?.login_provider;
      if (fromUser) return fromUser;
      const decoded = decodeAccessToken(state.token);
      return decoded?.login_provider || "local";
    },
    showTelegramLinkBanner(state) {
      if (!state.token || state.dismissedTelegramBanner) return false;
      if (!state.requiresTelegramLink) return false;
      const provider = this.loginProvider;
      return provider === "local" || provider === "google";
    },
    showEmailSetupBanner(state) {
      if (!state.token || state.dismissedEmailBanner) return false;
      if (!state.requiresEmailSetup) return false;
      return this.loginProvider === "telegram";
    },
  },

  actions: {
    persistFlags() {
      writeStoredFlags({
        requiresEmailSetup: this.requiresEmailSetup,
        requiresTelegramLink: this.requiresTelegramLink,
        dismissedEmailBanner: this.dismissedEmailBanner,
        dismissedTelegramBanner: this.dismissedTelegramBanner,
      });
    },

    applyNotificationFlags(payload = {}) {
      if (
        Object.prototype.hasOwnProperty.call(payload, "requires_email_setup") ||
        Object.prototype.hasOwnProperty.call(payload, "requires_email_update")
      ) {
        this.requiresEmailSetup = isFlagTruthy(
          payload.requires_email_setup ?? payload.requires_email_update,
        );
        if (!this.requiresEmailSetup) {
          this.dismissedEmailBanner = false;
        }
      }

      if (
        Object.prototype.hasOwnProperty.call(payload, "requires_telegram_link")
      ) {
        this.requiresTelegramLink = isFlagTruthy(
          payload.requires_telegram_link,
        );
        if (!this.requiresTelegramLink) {
          this.dismissedTelegramBanner = false;
        }
      }

      this.persistFlags();
    },

    dismissEmailBanner() {
      this.dismissedEmailBanner = true;
      this.persistFlags();
    },

    dismissTelegramBanner() {
      this.dismissedTelegramBanner = true;
      this.persistFlags();
    },

    markTelegramLinked() {
      this.requiresTelegramLink = false;
      this.dismissedTelegramBanner = false;
      this.persistFlags();
    },

    markEmailSetupDone() {
      this.requiresEmailSetup = false;
      this.dismissedEmailBanner = false;
      this.persistFlags();
    },

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

        this.applyNotificationFlags({
          requires_telegram_link:
            data.requires_telegram_link ?? user?.requires_telegram_link,
          requires_email_setup:
            data.requires_email_setup ?? user?.requires_email_setup,
        });

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
      this.requiresEmailSetup = false;
      this.requiresTelegramLink = false;
      this.dismissedEmailBanner = false;
      this.dismissedTelegramBanner = false;

      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem(FLAGS_KEY);
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

        this.applyNotificationFlags(payload);

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
