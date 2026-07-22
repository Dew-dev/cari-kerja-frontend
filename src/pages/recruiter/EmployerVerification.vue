<script setup>
import { computed, onMounted, onBeforeUnmount, reactive, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import { useEmployerVerificationStore } from "@/stores/employerVerificationStore";
import { isRateLimitedError, getRetryAfterSeconds } from "@/utils/apiErrors";

const { t } = useI18n();
const store = useEmployerVerificationStore();
const {
  status,
  loading,
  saving,
  uploadingType,
  submitting,
  reactivating,
  canEditDraft,
  canSubmit,
  canRequestReactivation,
  secondsRemaining,
  missingRequired,
  documents,
  application,
  reactivationRequest,
  restrictedVerification,
  verificationStatus,
} = storeToRefs(store);

const form = reactive({
  company_legal_name: "",
  npwp_number: "",
  nib_number: "",
  applicant_notes: "",
});

const reactivateReason = ref("");
const localCountdown = ref(null);
let countdownTimer = null;

const fileStorageUrl = import.meta.env.VITE_FILE_STORAGE_URL || "";

function hydrateForm() {
  const app = application.value;
  if (!app) return;
  form.company_legal_name = app.company_legal_name || "";
  form.npwp_number = app.npwp_number || "";
  form.nib_number = app.nib_number || "";
  form.applicant_notes = app.applicant_notes || "";
}

function formatCountdown(totalSeconds) {
  if (totalSeconds == null || Number.isNaN(totalSeconds)) return null;
  const s = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  return `${mins}m ${secs}s`;
}

const countdownLabel = computed(() => formatCountdown(localCountdown.value));

function startCountdown(fromSeconds) {
  if (countdownTimer) clearInterval(countdownTimer);
  if (fromSeconds == null) {
    localCountdown.value = null;
    return;
  }
  localCountdown.value = Math.max(0, Number(fromSeconds));
  countdownTimer = setInterval(() => {
    if (localCountdown.value == null) return;
    if (localCountdown.value <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;
      return;
    }
    localCountdown.value -= 1;
  }, 1000);
}

watch(secondsRemaining, (val) => startCountdown(val), { immediate: true });
watch(application, () => hydrateForm(), { immediate: true });

const requiredDocs = computed(() => status.value?.required_doc_types || []);
const optionalDocs = computed(() => status.value?.optional_doc_types || []);

function docForType(type) {
  return (documents.value || []).find((d) => d.doc_type === type) || null;
}

function fileUrl(doc) {
  if (!doc?.file_url) return null;
  if (/^https?:\/\//i.test(doc.file_url)) return doc.file_url;
  return `${fileStorageUrl}${doc.file_url}`;
}

function statusBadgeClass(key) {
  const map = {
    verified: "bg-emerald-100 text-emerald-800",
    grace: "bg-sky-100 text-sky-800",
    pending_review: "bg-amber-100 text-amber-800",
    rejected: "bg-red-100 text-red-800",
    blocked_incomplete: "bg-red-100 text-red-800",
  };
  return map[key] || "bg-gray-100 text-gray-700";
}

async function load() {
  try {
    await store.fetchStatus();
    hydrateForm();
  } catch (err) {
    push.error(
      err?.response?.data?.message || t("verification.kyc.loadFailed"),
    );
  }
}

async function saveDraft() {
  if (!canEditDraft.value) return;
  try {
    await store.saveApplication({ ...form });
    push.success(t("verification.kyc.draftSaved"));
  } catch (err) {
    if (isRateLimitedError(err)) {
      push.warning(t("captcha.rateLimited"));
      return;
    }
    push.error(
      err?.response?.data?.message || t("verification.kyc.saveFailed"),
    );
  }
}

async function onFileSelected(docType, event) {
  const file = event.target?.files?.[0];
  event.target.value = "";
  if (!file || !canEditDraft.value) return;

  const maxBytes = 10 * 1024 * 1024;
  if (file.size > maxBytes) {
    push.error(t("verification.kyc.fileTooLarge"));
    return;
  }

  try {
    await store.uploadDocument(docType, file);
    push.success(t("verification.kyc.uploadSuccess"));
  } catch (err) {
    if (isRateLimitedError(err)) {
      const sec = getRetryAfterSeconds(err);
      push.warning(
        sec
          ? t("verification.kyc.rateLimitedSeconds", { seconds: sec })
          : t("captcha.rateLimited"),
      );
      return;
    }
    push.error(
      err?.response?.data?.message || t("verification.kyc.uploadFailed"),
    );
  }
}

async function removeDoc(docType) {
  if (!canEditDraft.value) return;
  try {
    await store.removeDocument(docType);
    push.success(t("verification.kyc.deleteSuccess"));
  } catch (err) {
    push.error(
      err?.response?.data?.message || t("verification.kyc.deleteFailed"),
    );
  }
}

async function submitApplication() {
  if (!canSubmit.value) return;
  try {
    await store.submit();
    push.success(t("verification.kyc.submitSuccess"));
  } catch (err) {
    push.error(
      err?.response?.data?.message || t("verification.kyc.submitFailed"),
    );
  }
}

async function requestReactivation() {
  if (!canRequestReactivation.value) return;
  try {
    await store.requestReactivation(reactivateReason.value.trim() || null);
    push.success(t("verification.kyc.reactivateSuccess"));
  } catch (err) {
    push.error(
      err?.response?.data?.message || t("verification.kyc.reactivateFailed"),
    );
  }
}

onMounted(load);
onBeforeUnmount(() => {
  if (countdownTimer) clearInterval(countdownTimer);
});
</script>

<template>
  <div class="min-h-screen bg-slate-50 py-8 px-4">
    <div class="mx-auto max-w-3xl space-y-6">
      <header class="space-y-2">
        <h1 class="text-2xl font-bold text-slate-900">
          {{ t("verification.kyc.pageTitle") }}
        </h1>
        <p class="text-sm text-slate-600">
          {{ t("verification.kyc.pageSubtitle") }}
        </p>
      </header>

      <div
        v-if="restrictedVerification"
        class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
      >
        {{ t("verification.kyc.restrictedBanner") }}
      </div>

      <div
        v-if="loading && !status"
        class="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm"
      >
        {{ t("verification.kyc.loading") }}
      </div>

      <template v-else-if="status">
        <!-- Status card -->
        <section class="rounded-xl bg-white p-5 shadow-sm space-y-3">
          <div class="flex flex-wrap items-center gap-2 justify-between">
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                :class="statusBadgeClass(verificationStatus)"
              >
                {{
                  t(`verification.kyc.status.${verificationStatus || "unknown"}`)
                }}
              </span>
              <span
                v-if="application?.status"
                class="text-xs text-slate-500"
              >
                {{ t("verification.kyc.applicationStatus") }}:
                {{ t(`verification.kyc.appStatus.${application.status}`) }}
              </span>
            </div>
            <button
              type="button"
              class="text-sm text-[#0a9cf5] hover:underline disabled:opacity-50"
              :disabled="loading"
              @click="load"
            >
              {{ t("verification.kyc.refresh") }}
            </button>
          </div>

          <p v-if="status.company_name" class="text-sm text-slate-700">
            <span class="font-medium">{{ t("verification.kyc.company") }}:</span>
            {{ status.company_name }}
          </p>

          <p
            v-if="countdownLabel != null && !status.is_verified"
            class="text-sm font-medium text-slate-800"
          >
            {{ t("verification.kyc.deadlineCountdown") }}:
            <span class="tabular-nums text-[#0a9cf5]">{{ countdownLabel }}</span>
          </p>

          <div
            v-if="missingRequired.length"
            class="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-800"
          >
            <p class="font-medium mb-1">{{ t("verification.kyc.missingDocs") }}</p>
            <ul class="list-disc list-inside">
              <li v-for="type in missingRequired" :key="type">
                {{
                  requiredDocs.find((d) => d.type === type)?.label || type
                }}
              </li>
            </ul>
          </div>
        </section>

        <!-- Company form -->
        <section class="rounded-xl bg-white p-5 shadow-sm space-y-4">
          <h2 class="text-lg font-semibold text-slate-900">
            {{ t("verification.kyc.companySection") }}
          </h2>

          <div class="grid gap-4 sm:grid-cols-1">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                {{ t("verification.kyc.legalName") }}
                <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.company_legal_name"
                type="text"
                :disabled="!canEditDraft || saving"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a9cf5] disabled:bg-slate-50"
              />
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">
                  {{ t("verification.kyc.npwp") }}
                  <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.npwp_number"
                  type="text"
                  :disabled="!canEditDraft || saving"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a9cf5] disabled:bg-slate-50"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">
                  {{ t("verification.kyc.nib") }}
                  <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.nib_number"
                  type="text"
                  :disabled="!canEditDraft || saving"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a9cf5] disabled:bg-slate-50"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                {{ t("verification.kyc.notes") }}
              </label>
              <textarea
                v-model="form.applicant_notes"
                rows="3"
                :disabled="!canEditDraft || saving"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a9cf5] disabled:bg-slate-50"
              />
            </div>
          </div>

          <button
            v-if="canEditDraft"
            type="button"
            :disabled="saving"
            class="inline-flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white px-4 py-2.5 text-sm font-medium"
            @click="saveDraft"
          >
            {{ saving ? t("verification.kyc.saving") : t("verification.kyc.saveDraft") }}
          </button>
        </section>

        <!-- Documents -->
        <section class="rounded-xl bg-white p-5 shadow-sm space-y-4">
          <h2 class="text-lg font-semibold text-slate-900">
            {{ t("verification.kyc.documentsSection") }}
          </h2>
          <p class="text-xs text-slate-500">
            {{ t("verification.kyc.documentsHint") }}
          </p>

          <div class="space-y-3">
            <div
              v-for="doc in requiredDocs"
              :key="doc.type"
              class="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-slate-200 p-3"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-slate-800">
                  {{ doc.label }}
                  <span class="text-red-500">*</span>
                </p>
                <p
                  v-if="docForType(doc.type)"
                  class="text-xs text-emerald-700 truncate"
                >
                  {{ docForType(doc.type).file_name || t("verification.kyc.uploaded") }}
                  <a
                    v-if="fileUrl(docForType(doc.type))"
                    :href="fileUrl(docForType(doc.type))"
                    target="_blank"
                    rel="noopener"
                    class="ml-1 text-[#0a9cf5] underline"
                  >
                    {{ t("verification.kyc.viewFile") }}
                  </a>
                </p>
                <p v-else class="text-xs text-red-600">
                  {{ t("verification.kyc.notUploaded") }}
                </p>
              </div>
              <div v-if="canEditDraft" class="flex items-center gap-2 shrink-0">
                <label
                  class="cursor-pointer rounded-lg bg-[#0a9cf5] hover:bg-[#0890e0] text-white px-3 py-2 text-xs font-semibold"
                  :class="{ 'opacity-50 pointer-events-none': uploadingType === doc.type }"
                >
                  {{
                    uploadingType === doc.type
                      ? t("verification.kyc.uploading")
                      : t("verification.kyc.upload")
                  }}
                  <input
                    type="file"
                    class="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    @change="onFileSelected(doc.type, $event)"
                  />
                </label>
                <button
                  v-if="docForType(doc.type)"
                  type="button"
                  class="rounded-lg bg-red-50 text-red-700 px-3 py-2 text-xs font-semibold hover:bg-red-100"
                  :disabled="uploadingType === doc.type"
                  @click="removeDoc(doc.type)"
                >
                  {{ t("verification.kyc.remove") }}
                </button>
              </div>
            </div>

            <div
              v-for="doc in optionalDocs"
              :key="doc.type"
              class="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-dashed border-slate-200 p-3"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-slate-800">
                  {{ doc.label }}
                  <span class="text-xs text-slate-400 font-normal">
                    ({{ t("optional") }})
                  </span>
                </p>
                <p
                  v-if="docForType(doc.type)"
                  class="text-xs text-emerald-700 truncate"
                >
                  {{ docForType(doc.type).file_name || t("verification.kyc.uploaded") }}
                </p>
              </div>
              <div v-if="canEditDraft" class="flex items-center gap-2 shrink-0">
                <label
                  class="cursor-pointer rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-semibold"
                >
                  {{ t("verification.kyc.upload") }}
                  <input
                    type="file"
                    class="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    @change="onFileSelected(doc.type, $event)"
                  />
                </label>
                <button
                  v-if="docForType(doc.type)"
                  type="button"
                  class="rounded-lg bg-red-50 text-red-700 px-3 py-2 text-xs font-semibold"
                  @click="removeDoc(doc.type)"
                >
                  {{ t("verification.kyc.remove") }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Actions -->
        <section class="rounded-xl bg-white p-5 shadow-sm space-y-4">
          <button
            v-if="canEditDraft"
            type="button"
            :disabled="!canSubmit || submitting"
            class="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 text-sm font-semibold"
            @click="submitApplication"
          >
            {{
              submitting
                ? t("verification.kyc.submitting")
                : t("verification.kyc.submit")
            }}
          </button>

          <div
            v-if="restrictedVerification && (canRequestReactivation || reactivationRequest)"
            class="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3"
          >
            <p class="text-sm text-amber-900">
              {{ t("verification.kyc.reactivateHint") }}
            </p>
            <textarea
              v-if="canRequestReactivation"
              v-model="reactivateReason"
              rows="2"
              :placeholder="t('verification.kyc.reactivateReasonPlaceholder')"
              class="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm"
            />
            <button
              v-if="canRequestReactivation"
              type="button"
              :disabled="reactivating"
              class="inline-flex items-center justify-center rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-4 py-2.5 text-sm font-semibold"
              @click="requestReactivation"
            >
              {{
                reactivating
                  ? t("verification.kyc.reactivating")
                  : t("verification.kyc.reactivateCta")
              }}
            </button>
            <p
              v-else-if="reactivationRequest"
              class="text-sm font-medium text-amber-800"
            >
              {{ t("verification.kyc.reactivatePending") }}
            </p>
          </div>

          <p
            v-if="status.is_verified"
            class="text-sm font-medium text-emerald-700"
          >
            {{ t("verification.kyc.alreadyVerified") }}
          </p>
        </section>
      </template>
    </div>
  </div>
</template>
