import { defineStore } from "pinia";
import {
  getEmployerVerificationStatus,
  upsertEmployerVerificationApplication,
  uploadEmployerVerificationDocument,
  deleteEmployerVerificationDocument,
  submitEmployerVerificationApplication,
  requestEmployerReactivation,
} from "../services/employer-verification.api";
import { useAuthStore } from "./authStore";

function unwrap(res) {
  return res?.data?.data ?? res?.data ?? null;
}

export const useEmployerVerificationStore = defineStore("employerVerification", {
  state: () => ({
    status: null,
    loading: false,
    saving: false,
    uploadingType: null,
    submitting: false,
    reactivating: false,
    error: null,
  }),

  getters: {
    isVerified: (state) => Boolean(state.status?.is_verified),
    restrictedVerification: (state) =>
      Boolean(state.status?.restricted_verification),
    verificationStatus: (state) => state.status?.verification_status || null,
    secondsRemaining: (state) =>
      state.status?.seconds_remaining == null
        ? null
        : Number(state.status.seconds_remaining),
    missingRequired: (state) => state.status?.missing_required || [],
    documents: (state) => state.status?.documents || [],
    application: (state) => state.status?.application || null,
    applicationStatus: (state) => state.status?.application?.status || null,
    reactivationRequest: (state) => state.status?.reactivation_request || null,
    canEditDraft: (state) => {
      const appStatus = state.status?.application?.status;
      return !appStatus || appStatus === "draft" || appStatus === "rejected";
    },
    canSubmit: (state) => {
      const app = state.status?.application;
      if (!app || app.status !== "draft") return false;
      if (!app.company_legal_name || !app.npwp_number || !app.nib_number) {
        return false;
      }
      return (state.status?.missing_required || []).length === 0;
    },
    canRequestReactivation: (state) => {
      if (!state.status?.restricted_verification) return false;
      if (state.status?.reactivation_request) return false;
      const appStatus = state.status?.application?.status;
      return appStatus === "submitted" || appStatus === "under_review";
    },
  },

  actions: {
    syncAuthFlag() {
      const auth = useAuthStore();
      if (auth.role !== "recruiter") return;
      auth.setRestrictedVerification(
        Boolean(this.status?.restricted_verification),
      );
    },

    async fetchStatus() {
      this.loading = true;
      this.error = null;
      try {
        const data = unwrap(await getEmployerVerificationStatus());
        this.status = data;
        this.syncAuthFlag();
        return data;
      } catch (err) {
        this.error = err;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async saveApplication(form) {
      this.saving = true;
      this.error = null;
      try {
        const data = unwrap(
          await upsertEmployerVerificationApplication(form),
        );
        // Refresh full status (deadline / flags)
        await this.fetchStatus();
        return data;
      } catch (err) {
        this.error = err;
        throw err;
      } finally {
        this.saving = false;
      }
    },

    async uploadDocument(docType, file) {
      this.uploadingType = docType;
      this.error = null;
      try {
        const data = unwrap(
          await uploadEmployerVerificationDocument(docType, file),
        );
        await this.fetchStatus();
        return data;
      } catch (err) {
        this.error = err;
        throw err;
      } finally {
        this.uploadingType = null;
      }
    },

    async removeDocument(docType) {
      this.uploadingType = docType;
      this.error = null;
      try {
        const data = unwrap(
          await deleteEmployerVerificationDocument(docType),
        );
        await this.fetchStatus();
        return data;
      } catch (err) {
        this.error = err;
        throw err;
      } finally {
        this.uploadingType = null;
      }
    },

    async submit() {
      this.submitting = true;
      this.error = null;
      try {
        const data = unwrap(await submitEmployerVerificationApplication());
        await this.fetchStatus();
        return data;
      } catch (err) {
        this.error = err;
        throw err;
      } finally {
        this.submitting = false;
      }
    },

    async requestReactivation(reason) {
      this.reactivating = true;
      this.error = null;
      try {
        const data = unwrap(await requestEmployerReactivation(reason));
        await this.fetchStatus();
        return data;
      } catch (err) {
        this.error = err;
        throw err;
      } finally {
        this.reactivating = false;
      }
    },

    clear() {
      this.status = null;
      this.error = null;
      this.loading = false;
      this.saving = false;
      this.uploadingType = null;
      this.submitting = false;
      this.reactivating = false;
    },
  },
});
