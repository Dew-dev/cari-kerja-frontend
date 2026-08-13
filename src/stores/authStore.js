import { defineStore } from "pinia";
import { i18n } from "../i18n";
import { login as loginApi } from "../services/auth.api";
import { refreshToken as refreshApi } from "../services/auth.api";
import { disconnectSocket } from "../composables/useSocket";
import { decodeAccessToken } from "../utils/jwt";
import { isTelegramPlaceholderEmail } from "../utils/authFlags";
import { isCaptchaError, isRateLimitedError } from "../utils/apiErrors";
import {
  normalizeCompanyRole,
  normalizeRecruiterSessionUser,
  isCompanyOwner,
  isCompanyAdmin,
  COMPANY_ROLES,
} from "../utils/companyPermissions";

const RESTRICTED_KEY = "restrictedVerification";

function readRestrictedFlag() {
  return localStorage.getItem(RESTRICTED_KEY) === "1";
}

function persistUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
}

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
    /**
     * Soft-block KYC: akun suspended karena verification_incomplete.
     * Hanya boleh akses halaman verifikasi employer.
     */
    restrictedVerification: readRestrictedFlag(),
    accountNotice: null,
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

    companyId: (state) => state.user?.company_id ?? null,
    companyRole: (state) => normalizeCompanyRole(state.user?.company_role),
    recruiterId: (state) =>
      state.user?.recruiter_id ??
      (state.user?.role === "recruiter" ? state.user?.id : null),

    isCompanyOwner: (state) => isCompanyOwner(state.user?.company_role),
    isCompanyAdmin: (state) => isCompanyAdmin(state.user?.company_role),

    canManageBilling: (state) => {
      if (state.user?.role !== "recruiter") return false;
      // Legacy (no company_role yet): allow billing so existing owners tidak terkunci
      if (!state.user?.company_role && !state.user?.company_id) return true;
      return isCompanyOwner(state.user?.company_role);
    },

    canManageTeam: (state) => {
      if (state.user?.role !== "recruiter") return false;
      if (!state.user?.company_role && !state.user?.company_id) return true;
      return isCompanyAdmin(state.user?.company_role);
    },

    canEditCompany: (state) => {
      if (state.user?.role !== "recruiter") return false;
      if (!state.user?.company_role && !state.user?.company_id) return true;
      return isCompanyAdmin(state.user?.company_role);
    },

    canManageVerification: (state) => {
      if (state.user?.role !== "recruiter") return false;
      if (!state.user?.company_role && !state.user?.company_id) return true;
      return isCompanyAdmin(state.user?.company_role);
    },

    publicCompanyPath: (state) => {
      const companyId = state.user?.company_id;
      if (companyId) return `/companies/${companyId}`;
      const rid = state.user?.recruiter_id || state.user?.id;
      return rid ? `/recruiters/${rid}` : "/recruiter/company";
    },
  },

  actions: {
    mergeUser(partial) {
      const merged = normalizeRecruiterSessionUser(
        { ...(this.user || {}), ...partial },
        this.user || {},
      );
      this.user = merged;
      persistUser(this.user);
    },

    setRestrictedVerification(value, notice = null) {
      this.restrictedVerification = Boolean(value);
      if (notice != null) this.accountNotice = notice;
      if (this.restrictedVerification) {
        localStorage.setItem(RESTRICTED_KEY, "1");
      } else {
        localStorage.removeItem(RESTRICTED_KEY);
        this.accountNotice = null;
      }
    },

    applySessionFlags(data = {}) {
      if (Object.prototype.hasOwnProperty.call(data, "restricted_verification")) {
        this.setRestrictedVerification(
          data.restricted_verification,
          data.account_notice || null,
        );
      } else if (data.account_notice) {
        this.accountNotice = data.account_notice;
      }
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
        this.$patch({ refreshToken });

        const decoded = decodeAccessToken(token) || {};
        this.user = normalizeRecruiterSessionUser(
          {
            ...user,
            company_id: user?.company_id ?? decoded.company_id,
            company_role: user?.company_role ?? decoded.company_role,
            recruiter_id: user?.recruiter_id ?? decoded.recruiter_id,
            user_id: user?.user_id ?? decoded.id ?? user?.id,
            login_provider:
              user?.login_provider || decoded.login_provider || "local",
          },
          {},
        );

        localStorage.setItem("token", token);
        localStorage.setItem("refreshToken", refreshToken);
        persistUser(this.user);

        this.captchaRequired = false;
        this.applySessionFlags(data);

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

        if (
          err?.response?.status === 403 &&
          String(msg || "").includes("ACCOUNT_RESTRICTED") &&
          !String(msg || "").includes("VERIFICATION_REQUIRED")
        ) {
          this.error = i18n.global.t("notifications.accountSuspended");
          return false;
        }

        if (
          err?.response?.status === 403 &&
          String(msg || "").toLowerCase().includes("suspended") &&
          !String(msg || "").includes("VERIFICATION_REQUIRED")
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
      this.$patch({ refreshToken: null });
      this.user = null;
      this.captchaRequired = false;
      this.needVerifyEmail = false;
      this.restrictedVerification = false;
      this.accountNotice = null;

      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("notificationChannelFlags");
      localStorage.removeItem(RESTRICTED_KEY);
    },

    /**
     * Refresh access token. Named differently from state `refreshToken`
     * to avoid Pinia state/action name collision.
     */
    async refreshSession({ logoutOnFail = true } = {}) {
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
          const decoded = decodeAccessToken(token) || {};
          const email = isTelegramPlaceholderEmail(user.email) ? "" : user.email;

          this.user = normalizeRecruiterSessionUser(
            {
              ...user,
              email: email || this.user?.email || "",
              name: user.name || this.user?.name,
              avatar_url: user.avatar_url ?? this.user?.avatar_url,
              company_id: user.company_id ?? decoded.company_id ?? this.user?.company_id,
              company_role:
                user.company_role ?? decoded.company_role ?? this.user?.company_role,
              recruiter_id:
                user.recruiter_id ?? decoded.recruiter_id ?? this.user?.recruiter_id,
              user_id: user.user_id || user.id || this.user?.user_id,
              login_provider:
                user.login_provider ||
                decoded.login_provider ||
                this.user?.login_provider,
            },
            this.user || {},
          );
          persistUser(this.user);
        }

        this.applySessionFlags(payload);

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

export { COMPANY_ROLES };
