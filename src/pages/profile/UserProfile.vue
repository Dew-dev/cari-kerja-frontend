<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import api from "@/services/api";
import { getSavedJobs, removeSavedJob } from "@/services/saved-jobs.api";
import { changeEmail } from "@/services/auth.api";
import { useAuthStore } from "@/stores/authStore.js";
import SearchableSelect from "@/components/common/SearchableSelect.vue";
import RichTextEditor from "@/components/common/RichTextEditor.vue";
import MaskedNumberInput from "@/components/common/MaskedNumberInput.vue";
import CommunicationPreferencesCard from "@/components/worker/CommunicationPreferencesCard.vue";
import JobAlertsCard from "@/components/worker/JobAlertsCard.vue";
import { displayEmail } from "@/utils/authFlags";
import { isContentRejectedError, isDisposableEmailRejected, isRateLimitedError } from "@/utils/apiErrors";
import { stripHtml } from "@/utils/richText";
import { resolveUploadUrl } from "@/utils/mediaUrl";

const router = useRouter();
const auth = useAuthStore();
const { t } = useI18n();

const activeTab = ref(localStorage.getItem("profileActiveTab") || "profile");
const loadingProfile = ref(false);
const savingProfile = ref(false);
const savingEmail = ref(false);
const loadingApplied = ref(false);
const loadingSaved = ref(false);
const appliedError = ref("");
const savedError = ref("");

const isTelegramLogin = computed(() => auth.loginProvider === "telegram");
const isGoogleLogin = computed(() => auth.loginProvider === "google");
/** Email akun hanya bisa diubah untuk login email/password — bukan channel notifikasi silang-provider. */
const canEditEmail = computed(() => auth.loginProvider === "local");

const form = reactive({
  id: "",
  name: "",
  email: "",
  telephone: "",
  address: "",
  headline: "",
  bio: "",
  date_of_birth: "",
  gender_id: "",
  nationality_id: "",
  religion_id: "",
  marriage_status_id: "",
  profile_summary: "",
  current_salary: "",
  expected_salary: "",
  current_salary_currency_id: "",
  expected_salary_currency_id: "",
});

const avatarFile = ref(null);
const avatarPreview = ref(null);
const avatarFromBackend = ref(null);

const resumes = ref([]);
const portfolios = ref([]);
const workExperiences = ref([]);
const educations = ref([]);
const certifications = ref([]);
const skills = ref([]);

// Resume upload (controlled)
const resumeFile = ref(null);
const resumeTitle = ref("");
const resumeAsDefault = ref(false);
const uploadingResume = ref(false);

// Work / Education / Certification inline panels
const showWorkPanel = ref(false);
const editingWorkKey = ref(null);
const savingWork = ref(false);
const workForm = reactive({
  company_name: "",
  job_title: "",
  start_date: "",
  end_date: "",
  is_current: false,
  description: "",
});

const showEducationPanel = ref(false);
const editingEducationKey = ref(null);
const savingEducation = ref(false);
const educationForm = reactive({
  institution_name: "",
  degree: "",
  major: "",
  start_date: "",
  end_date: "",
  is_current: false,
  description: "",
});

const showCertificationPanel = ref(false);
const editingCertificationKey = ref(null);
const savingCertification = ref(false);
const certificationForm = reactive({
  name: "",
  issuer: "",
  issue_date: "",
  expiry_date: "",
  credential_id: "",
  link: "",
  is_active: true,
});

function createLocalKey() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function profileItemKey(item) {
  return item?.id ?? item?._localKey;
}

const genders = ref([
  { id: "1", name: "Male" },
  { id: "2", name: "Female" },
  { id: "3", name: "Other" },
]);
const nationalities = ref([]);
const nationalitySearch = ref("");
const religions = ref([
  { id: "1", name: "Islam" },
  { id: "2", name: "Christian" },
  { id: "3", name: "Catholic" },
  { id: "4", name: "Hindu" },
  { id: "5", name: "Buddha" },
  { id: "6", name: "Other" },
]);
const maritalStatuses = ref([
  { id: "1", status: "Married" },
  { id: "2", status: "Not Married" },
  { id: "3", status: "Divorced" },
  { id: "4", status: "Widowed" },
]);
const currencies = ref([]);

const currentCurrencyInput = ref("");
const expectedCurrencyInput = ref("");
const currencyOptions = ref([]);
const currencyLoading = ref(false);
const isSelectingCurrentCurrency = ref(false);
const isSelectingExpectedCurrency = ref(false);
const showCurrentCurrencyDropdown = ref(false);
const showExpectedCurrencyDropdown = ref(false);
let currentCurrencyTimeout = null;
let expectedCurrencyTimeout = null;
const DEFAULT_CURRENCY_CODE = "IDR";

const appliedJobs = ref([]);
const savedJobs = ref([]);

const showSkillModal = ref(false);
const skillSearchQuery = ref("");
const skillSuggestions = ref([]);
const loadingSkills = ref(false);

const languages = ref([]);
const showLanguagePanel = ref(false);
const editingLanguageId = ref(null);
const languageForm = reactive({
  language_id: null,
  language_name: "",
  proficiency_level_id: "",
  is_primary: false,
});
const languageSuggestions = ref([]);
const loadingLanguageOptions = ref(false);
const savingLanguage = ref(false);
let languageSearchTimeout = null;

const proficiencyOptions = computed(() => [
  { id: 1, label: t("profile.proficiency.beginner") },
  { id: 2, label: t("profile.proficiency.intermediate") },
  { id: 3, label: t("profile.proficiency.fluent") },
  { id: 4, label: t("profile.proficiency.native") },
]);

const profileTabs = computed(() => [
  { id: "profile", label: t("profile.personalInfo"), shortLabel: t("profile.personalInfo") },
  { id: "resumes", label: t("resume"), shortLabel: t("resume") },
  { id: "work", label: t("profile.workExperience"), shortLabel: t("profile.work") },
  { id: "education", label: t("education"), shortLabel: t("profile.edu") },
  { id: "certifications", label: t("profile.certifications"), shortLabel: t("profile.cert") },
  { id: "cvparser", label: t("profile.cvParser.tab"), shortLabel: "CV" },
  { id: "applied", label: t("profile.appliedJobs"), shortLabel: t("profile.applied") },
  { id: "saved", label: t("profile.savedJobs"), shortLabel: t("saved") },
]);

function proficiencyLabel(id) {
  return proficiencyOptions.value.find((p) => p.id === Number(id))?.label || "";
}

// CV Parser
const cvParserFileInput = ref(null);
const cvParserLoading = ref(false);
const cvParserRateLimited = ref(false);
const cvParsedData = ref(null);
const cvParserError = ref("");
let cvParserCooldownTimer = null;

const RESUME_LIMIT = 3;
const CV_MAX_MB = 5;
const linkStorageUrl =
  import.meta.env.VITE_FILE_STORAGE_URL;

const savedJobCards = computed(() =>
  (savedJobs.value || []).map((item) => item?.job || item?.job_post || item),
);

const appliedJobCards = computed(() =>
  (appliedJobs.value || []).map((item) => item?.job || item?.job_post || item),
);

const nationalityOptions = computed(() =>
  nationalities.value.map((n) => ({
    value: String(n.id),
    label: n.label || `${n.country_name} (${n.iso_alpha3 || ""})`,
  })),
);

function formatDateForInput(dateString) {
  if (!dateString) return "";
  try {
    return new Date(dateString).toISOString().split("T")[0];
  } catch {
    return "";
  }
}

async function loadProfile() {
  try {
    loadingProfile.value = true;
    const res = await api.get(`/users/workers/me`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = res.data?.data || res.data || {};
    form.id = data.id ?? "";
    form.name = data.name ?? "";
    // Email kosong / placeholder Telegram = normal (bukan error)
    form.email = displayEmail(data.email);
    form.telephone = data.telephone ?? "";
    form.address = data.address ?? "";
    form.headline = data.headline ?? "";
    form.bio = data.bio ?? "";
    form.date_of_birth = data.date_of_birth
      ? new Date(data.date_of_birth).toISOString().split("T")[0]
      : "";
    form.gender_id = String(data.gender_id ?? "");
    form.nationality_id = String(data.nationality_id ?? "");
    form.religion_id = String(data.religion_id ?? "");
    form.marriage_status_id = String(data.marriage_status_id ?? "");
    form.profile_summary = data.profile_summary ?? "";
    form.current_salary = data.current_salary ?? "";
    form.expected_salary = data.expected_salary ?? "";
    form.current_salary_currency_id = String(data.current_salary_currency_id ?? "");
    form.expected_salary_currency_id = String(data.expected_salary_currency_id ?? "");

    // Load currency display names
    if (data.current_salary_currency) {
      currentCurrencyInput.value = `${data.current_salary_currency.name} (${data.current_salary_currency.code})`;
    }
    if (data.expected_salary_currency) {
      expectedCurrencyInput.value = `${data.expected_salary_currency.name} (${data.expected_salary_currency.code})`;
    }

    // Default to IDR when profile has no currency yet
    if (!form.current_salary_currency_id || !form.expected_salary_currency_id) {
      await setDefaultCurrencies();
    }

    avatarFromBackend.value = data.avatar_url ?? null;
    resumes.value = data.resumes ?? [];
    portfolios.value = data.portfolios ?? [];
    workExperiences.value = (data.work_experiences ?? []).map((w) => ({
      ...w,
      start_date: formatDateForInput(w.start_date),
      end_date: formatDateForInput(w.end_date),
    }));
    educations.value = (data.educations ?? []).map((e) => ({
      ...e,
      start_date: formatDateForInput(e.start_date),
      end_date: formatDateForInput(e.end_date),
    }));
    certifications.value = (data.certifications ?? []).map((c) => ({
      ...c,
      issue_date: formatDateForInput(c.issue_date),
      expiry_date: formatDateForInput(c.expiry_date),
    //   isSaved: true,
    }));
    skills.value = data.worker_skills ?? [];
    languages.value = data.languages ?? [];
  } catch (err) {
    console.error("Failed to load profile:", err);
  } finally {
    loadingProfile.value = false;
  }
}

async function saveProfile() {
  try {
    savingProfile.value = true;

    const formData = new FormData();
    formData.append("id", form.id);
    formData.append("name", form.name);
    formData.append("telephone", form.telephone);
    formData.append("address", form.address);
    formData.append("date_of_birth", form.date_of_birth);
    formData.append("gender_id", form.gender_id);
    formData.append("nationality_id", form.nationality_id);
    formData.append("religion_id", form.religion_id);
    formData.append("marriage_status_id", form.marriage_status_id);
    formData.append("profile_summary", form.profile_summary);
    formData.append("current_salary", form.current_salary);
    formData.append("expected_salary", form.expected_salary);
    formData.append("current_salary_currency_id", form.current_salary_currency_id);
    formData.append("expected_salary_currency_id", form.expected_salary_currency_id);

    if (avatarFile.value) {
      formData.append("avatar", avatarFile.value);
    }

    await api.put("/users/workers/me", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    auth.user = { ...auth.user, name: form.name, email: form.email };
    localStorage.setItem("user", JSON.stringify(auth.user));

     push.success(t('profile.profileUpdatedSuccessfully'));
  } catch (err) {
    if (isContentRejectedError(err)) {
      push.warning(t("contentRejected.upload"));
      return;
    }
     push.error(err?.response?.data?.message || t('profile.failedToUpdateProfile'));
  } finally {
    savingProfile.value = false;
  }
}

async function saveAccountEmail() {
  if (!canEditEmail.value) return;

  const email = String(form.email || "").trim().toLowerCase();
  if (!email) {
    push.warning(t("auth.banners.emailRequired"));
    return;
  }

  try {
    savingEmail.value = true;
    const res = await changeEmail(email);
    const data = res.data?.data || {};

    if (data.token) {
      auth.token = data.token;
      localStorage.setItem("token", data.token);
    }

    auth.mergeUser({ email });
    push.success(t("auth.banners.verificationEmailSent"));
  } catch (err) {
    if (isDisposableEmailRejected(err)) {
      push.warning(t("contentRejected.disposableEmail"));
      return;
    }
    push.error(
      err?.response?.data?.message || t("auth.banners.failedChangeEmail"),
    );
  } finally {
    savingEmail.value = false;
  }
}

// Resume management
async function addResume(file, title, isDefault) {
  try {
    if (!/application\/pdf/i.test(file.type)) {
      push.error(t("profile.onlyPDFAllowed"));
      return;
    }

    if (file.size > CV_MAX_MB * 1024 * 1024) {
      push.error(t("profile.maxSizeMB", { size: CV_MAX_MB }));
      return;
    }

    if (!title.trim()) {
      push.error(t("profile.titleRequired"));
      return;
    }

    if (resumes.value.length >= RESUME_LIMIT) {
      push.error(t("profile.maxResumes", { limit: RESUME_LIMIT }));
      return;
    }

    uploadingResume.value = true;
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("title", title.trim());
    formData.append("is_default", isDefault ? "true" : "false");

    const res = await api.post("/workers/resumes", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = res.data?.data;
    resumes.value.push(data);

    if (data.is_default) {
      resumes.value = resumes.value.map((r) => ({
        ...r,
        is_default: r.id === data.id,
      }));
    }

    push.success(t("profile.resumeAddedSuccessfully"));
    resumeFile.value = null;
    resumeTitle.value = "";
    resumeAsDefault.value = false;
    if (resumeFileInput.value) resumeFileInput.value.value = "";
  } catch (err) {
    if (isContentRejectedError(err)) {
      push.warning(t("contentRejected.upload"));
      return;
    }
    push.error(t("profile.failedToUploadResume"));
  } finally {
    uploadingResume.value = false;
  }
}

async function removeResume(id) {
  try {
    await api.delete(`/workers/resumes/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    resumes.value = resumes.value.filter((r) => r.id !== id);

    if (!resumes.value.some((r) => r.is_default) && resumes.value[0]) {
      await setPrimaryResume(resumes.value[0].id);
    }

    push.success(t("profile.resumeRemoved"));
  } catch (err) {
    push.error(t("profile.failedToDeleteResume"));
  }
}

async function setPrimaryResume(id) {
  try {
    const target = resumes.value.find((r) => r.id === id);
    if (!target) return;

    await api.put(
      `/workers/resumes/${id}`,
      {
        title: target.title,
        resume_url: target.resume_url,
        is_default: true,
      },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      },
    );

    resumes.value = resumes.value.map((r) => ({
      ...r,
      is_default: r.id === id,
    }));

    push.success(t("profile.resumeSetAsPrimary"));
  } catch (err) {
    push.error(t("profile.failedToSetPrimaryResume"));
  }
}

function onResumeFileChange(e) {
  resumeFile.value = e.target.files?.[0] || null;
}

function handleAddResume() {
  if (!resumeFile.value) {
    push.error(t("notifications.pleaseSelectFile"));
    return;
  }
  addResume(resumeFile.value, resumeTitle.value, resumeAsDefault.value);
}

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

function formatProfileDateRange(start, end, isCurrent) {
  const startLabel = start ? formatDate(start) : "";
  if (isCurrent) {
    return startLabel
      ? `${startLabel} – ${t("workerProfile.present")}`
      : t("workerProfile.present");
  }
  const endLabel = end ? formatDate(end) : "";
  if (startLabel && endLabel) return `${startLabel} – ${endLabel}`;
  return startLabel || endLabel || "";
}

// Work Experience — list + inline panel (no placeholder POST on Add)
function resetWorkForm() {
  editingWorkKey.value = null;
  workForm.company_name = "";
  workForm.job_title = "";
  workForm.start_date = "";
  workForm.end_date = "";
  workForm.is_current = false;
  workForm.description = "";
}

function openWorkForm(item = null) {
  if (item) {
    editingWorkKey.value = profileItemKey(item);
    workForm.company_name = item.company_name || "";
    workForm.job_title = item.job_title || "";
    workForm.start_date = formatDateForInput(item.start_date);
    workForm.end_date = item.is_current ? "" : formatDateForInput(item.end_date);
    workForm.is_current = Boolean(item.is_current);
    workForm.description = item.description || "";
  } else {
    resetWorkForm();
  }
  showWorkPanel.value = true;
}

function closeWorkForm() {
  showWorkPanel.value = false;
  resetWorkForm();
}

async function saveWorkExp() {
  if (!workForm.company_name.trim() || !workForm.job_title.trim()) {
    push.warning(t("profile.workFormIncomplete"));
    return;
  }

  const payload = {
    company_name: workForm.company_name.trim(),
    job_title: workForm.job_title.trim(),
    start_date: workForm.start_date || null,
    end_date: workForm.is_current ? null : workForm.end_date || null,
    is_current: Boolean(workForm.is_current),
    description: workForm.description || null,
  };

  try {
    savingWork.value = true;
    const existing = workExperiences.value.find(
      (w) => profileItemKey(w) === editingWorkKey.value,
    );

    if (existing?.id) {
      await api.put(`/workers/work-exp/${existing.id}`, payload, {
        headers: authHeaders(),
      });
      Object.assign(existing, payload);
      push.success(t("profile.workExperienceAdded"));
    } else if (existing?._pending || existing?._localKey) {
      const res = await api.post("/workers/work-exp", payload, {
        headers: authHeaders(),
      });
      const saved = res.data?.data || {};
      const idx = workExperiences.value.findIndex(
        (w) => profileItemKey(w) === editingWorkKey.value,
      );
      if (idx !== -1) {
        workExperiences.value[idx] = {
          ...payload,
          id: saved.id,
          start_date: formatDateForInput(saved.start_date || payload.start_date),
          end_date: payload.is_current
            ? null
            : formatDateForInput(saved.end_date || payload.end_date),
        };
      }
      push.success(t("profile.workExperienceAdded"));
    } else {
      const res = await api.post("/workers/work-exp", payload, {
        headers: authHeaders(),
      });
      const saved = res.data?.data || {};
      workExperiences.value.unshift({
        ...payload,
        id: saved.id,
        start_date: formatDateForInput(saved.start_date || payload.start_date),
        end_date: payload.is_current
          ? null
          : formatDateForInput(saved.end_date || payload.end_date),
      });
      push.success(t("profile.workExperienceAdded"));
    }
    closeWorkForm();
  } catch (err) {
    push.error(
      err?.response?.data?.message || t("profile.failedToUpdateWorkExperience"),
    );
  } finally {
    savingWork.value = false;
  }
}

async function deleteWorkExp(item) {
  const key = profileItemKey(item);
  if (!item?.id) {
    workExperiences.value = workExperiences.value.filter(
      (w) => profileItemKey(w) !== key,
    );
    if (editingWorkKey.value === key) closeWorkForm();
    return;
  }
  try {
    await api.delete(`/workers/work-exp/${item.id}`, {
      headers: authHeaders(),
    });
    workExperiences.value = workExperiences.value.filter((w) => w.id !== item.id);
    if (editingWorkKey.value === key) closeWorkForm();
    push.success(t("profile.workExperienceRemoved"));
  } catch (err) {
    push.error(t("profile.failedToDeleteWorkExperience"));
  }
}

// Education
function resetEducationForm() {
  editingEducationKey.value = null;
  educationForm.institution_name = "";
  educationForm.degree = "";
  educationForm.major = "";
  educationForm.start_date = "";
  educationForm.end_date = "";
  educationForm.is_current = false;
  educationForm.description = "";
}

function openEducationForm(item = null) {
  if (item) {
    editingEducationKey.value = profileItemKey(item);
    educationForm.institution_name = item.institution_name || "";
    educationForm.degree = item.degree || "";
    educationForm.major = item.major || "";
    educationForm.start_date = formatDateForInput(item.start_date);
    educationForm.end_date = item.is_current
      ? ""
      : formatDateForInput(item.end_date);
    educationForm.is_current = Boolean(item.is_current);
    educationForm.description = item.description || "";
  } else {
    resetEducationForm();
  }
  showEducationPanel.value = true;
}

function closeEducationForm() {
  showEducationPanel.value = false;
  resetEducationForm();
}

async function saveEducation() {
  if (!educationForm.institution_name.trim() || !educationForm.degree.trim()) {
    push.warning(t("profile.educationFormIncomplete"));
    return;
  }

  const payload = {
    institution_name: educationForm.institution_name.trim(),
    degree: educationForm.degree.trim(),
    major: educationForm.major.trim(),
    start_date: educationForm.start_date || null,
    end_date: educationForm.is_current ? null : educationForm.end_date || null,
    is_current: Boolean(educationForm.is_current),
    description: educationForm.description || "",
  };

  try {
    savingEducation.value = true;
    const existing = educations.value.find(
      (e) => profileItemKey(e) === editingEducationKey.value,
    );

    if (existing?.id) {
      await api.put(`/workers/educations/${existing.id}`, payload, {
        headers: authHeaders(),
      });
      Object.assign(existing, payload);
      push.success(t("profile.educationAdded"));
    } else if (existing?._pending || existing?._localKey) {
      const res = await api.post("/workers/educations", payload, {
        headers: authHeaders(),
      });
      const saved = res.data?.data || {};
      const idx = educations.value.findIndex(
        (e) => profileItemKey(e) === editingEducationKey.value,
      );
      if (idx !== -1) {
        educations.value[idx] = {
          ...payload,
          id: saved.id,
          start_date: formatDateForInput(saved.start_date || payload.start_date),
          end_date: payload.is_current
            ? null
            : formatDateForInput(saved.end_date || payload.end_date),
        };
      }
      push.success(t("profile.educationAdded"));
    } else {
      const res = await api.post("/workers/educations", payload, {
        headers: authHeaders(),
      });
      const saved = res.data?.data || {};
      educations.value.unshift({
        ...payload,
        id: saved.id,
        start_date: formatDateForInput(saved.start_date || payload.start_date),
        end_date: payload.is_current
          ? null
          : formatDateForInput(saved.end_date || payload.end_date),
      });
      push.success(t("profile.educationAdded"));
    }
    closeEducationForm();
  } catch (err) {
    push.error(
      err?.response?.data?.message || t("profile.failedToUpdateEducation"),
    );
  } finally {
    savingEducation.value = false;
  }
}

async function deleteEducation(item) {
  const key = profileItemKey(item);
  if (!item?.id) {
    educations.value = educations.value.filter(
      (e) => profileItemKey(e) !== key,
    );
    if (editingEducationKey.value === key) closeEducationForm();
    return;
  }
  try {
    await api.delete(`/workers/educations/${item.id}`, {
      headers: authHeaders(),
    });
    educations.value = educations.value.filter((e) => e.id !== item.id);
    if (editingEducationKey.value === key) closeEducationForm();
    push.success(t("profile.educationRemoved"));
  } catch (err) {
    push.error(t("profile.failedToDeleteEducation"));
  }
}

// Certifications
function resetCertificationForm() {
  editingCertificationKey.value = null;
  certificationForm.name = "";
  certificationForm.issuer = "";
  certificationForm.issue_date = "";
  certificationForm.expiry_date = "";
  certificationForm.credential_id = "";
  certificationForm.link = "";
  certificationForm.is_active = true;
}

function openCertificationForm(item = null) {
  if (item) {
    editingCertificationKey.value = profileItemKey(item);
    certificationForm.name = item.name || "";
    certificationForm.issuer = item.issuer || "";
    certificationForm.issue_date = formatDateForInput(item.issue_date);
    certificationForm.expiry_date = item.is_active === false
      ? ""
      : formatDateForInput(item.expiry_date);
    certificationForm.credential_id = item.credential_id || "";
    certificationForm.link = item.link || "";
    certificationForm.is_active = item.is_active !== false;
  } else {
    resetCertificationForm();
  }
  showCertificationPanel.value = true;
}

function closeCertificationForm() {
  showCertificationPanel.value = false;
  resetCertificationForm();
}

async function saveCertification() {
  if (!certificationForm.name.trim() || !certificationForm.issuer.trim()) {
    push.warning(t("profile.certificationFormIncomplete"));
    return;
  }

  const payload = {
    name: certificationForm.name.trim(),
    issuer: certificationForm.issuer.trim(),
    issue_date: certificationForm.issue_date || null,
    expiry_date: certificationForm.is_active
      ? certificationForm.expiry_date || null
      : null,
    credential_id: certificationForm.credential_id || "",
    link: certificationForm.link || "",
    is_active: Boolean(certificationForm.is_active),
  };

  try {
    savingCertification.value = true;
    const existing = certifications.value.find(
      (c) => profileItemKey(c) === editingCertificationKey.value,
    );

    if (existing?.id) {
      await api.put(`/workers/cert/${existing.id}`, payload, {
        headers: authHeaders(),
      });
      Object.assign(existing, {
        ...payload,
        issue_date: formatDateForInput(payload.issue_date),
        expiry_date: formatDateForInput(payload.expiry_date),
      });
      push.success(t("profile.certificationAdded"));
    } else if (existing?._pending || existing?._localKey) {
      const res = await api.post("/workers/cert", payload, {
        headers: authHeaders(),
      });
      const saved = res.data?.data || {};
      const idx = certifications.value.findIndex(
        (c) => profileItemKey(c) === editingCertificationKey.value,
      );
      if (idx !== -1) {
        certifications.value[idx] = {
          ...payload,
          id: saved.id,
          issue_date: formatDateForInput(saved.issue_date || payload.issue_date),
          expiry_date: formatDateForInput(
            saved.expiry_date || payload.expiry_date,
          ),
        };
      }
      push.success(t("profile.certificationAdded"));
    } else {
      const res = await api.post("/workers/cert", payload, {
        headers: authHeaders(),
      });
      const saved = res.data?.data || {};
      certifications.value.unshift({
        ...payload,
        id: saved.id,
        issue_date: formatDateForInput(saved.issue_date || payload.issue_date),
        expiry_date: formatDateForInput(
          saved.expiry_date || payload.expiry_date,
        ),
      });
      push.success(t("profile.certificationAdded"));
    }
    closeCertificationForm();
  } catch (err) {
    push.error(
      err?.response?.data?.message || t("profile.failedToUpdateCertification"),
    );
  } finally {
    savingCertification.value = false;
  }
}

async function deleteCertification(item) {
  const key = profileItemKey(item);
  if (!item?.id) {
    certifications.value = certifications.value.filter(
      (c) => profileItemKey(c) !== key,
    );
    if (editingCertificationKey.value === key) closeCertificationForm();
    return;
  }
  try {
    await api.delete(`/workers/cert/${item.id}`, {
      headers: authHeaders(),
    });
    certifications.value = certifications.value.filter((c) => c.id !== item.id);
    if (editingCertificationKey.value === key) closeCertificationForm();
    push.success(t("profile.certificationRemoved"));
  } catch (err) {
    push.error(t("profile.failedToDeleteCertification"));
  }
}

// Skills
async function fetchSkills(search = "") {
  if (!search.trim()) {
    skillSuggestions.value = [];
    return [];
  }

  try {
    loadingSkills.value = true;
    const query = `?page=1&limit=10&search=${encodeURIComponent(search)}`;
    const res = await api.get(`/skills${query}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const data = res.data?.data || [];
    skillSuggestions.value = data.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase())
    );
    return data;
  } catch (err) {
    console.error("Failed to fetch skills:", err);
    return [];
  } finally {
    loadingSkills.value = false;
  }
}

function openSkillModal() {
  showSkillModal.value = true;
  skillSearchQuery.value = "";
  skillSuggestions.value = [];
}

function closeSkillModal() {
  showSkillModal.value = false;
  skillSearchQuery.value = "";
  skillSuggestions.value = [];
}

async function handleSkillSearch(e) {
  skillSearchQuery.value = e.target.value;
  await fetchSkills(e.target.value);
}

async function addSkillFromSuggestion(skill) {
  // Check if already added
  if (skills.value.some(s => s.skill_id === skill.id || s.id === skill.id)) {
     push.warning(t('profile.skillAlreadyAdded'));
    return;
  }

  try {
    const res = await api.post(
      "/workers/skills",
      {
        skill_id: skill.id,
      },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      },
    );

    const addedSkill = res.data.data;
    skills.value.push({
      id: skill.id,
      skill_id: addedSkill.skill_id,
      skill_name: skill.name
    });
     push.success(t('profile.skillAdded'));
    skillSearchQuery.value = "";
    skillSuggestions.value = [];
  } catch (err) {
     push.error(err?.response?.data?.message || t('profile.failedToAddSkill'));
  }
}

async function createAndAddSkill(skillName) {
  if (!skillName.trim()) return;

  try {
    // First create the skill
    const createRes = await api.post(
      "/skills",
      { skill_name: skillName.trim() },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      },
    );

    const newSkill = createRes.data?.data;
    if (!newSkill) throw new Error("Skill creation failed");

    // Then add it to worker's skills
    const addRes = await api.post(
      "/workers/skills",
      { skill_id: newSkill.id },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      },
    );

    skills.value.push({id:newSkill.id, skill_id: newSkill.id, skill_name: newSkill.skill_name});
    console.log("New skill created and added:", newSkill);
     push.success(t('profile.skillCreatedAndAdded'));
    skillSearchQuery.value = "";
    skillSuggestions.value = [];
  } catch (err) {
     push.error(err?.response?.data?.message || t('profile.failedToCreateSkill'));
  }
}

function handleSkillEnter() {
  if (!skillSearchQuery.value.trim()) return;

  // If suggestions exist, add the first one
  if (skillSuggestions.value.length > 0) {
    addSkillFromSuggestion(skillSuggestions.value[0]);
    return;
  }

  // Otherwise, create a new skill
  createAndAddSkill(skillSearchQuery.value.trim());
}

async function deleteSkill(skill) {
  const skillId = skill.id;
  
  try {
    await api.delete(`/workers/skills/${skillId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    skills.value = skills.value.filter((s) => s.id !== skillId);
     push.success(t('profile.skillRemoved'));
  } catch (err) {
     push.error(t('profile.failedToDeleteSkill'));
  }
}

// Languages
async function fetchLanguageOptions(search = "") {
  if (!search.trim()) {
    languageSuggestions.value = [];
    return;
  }
  try {
    loadingLanguageOptions.value = true;
    // Public endpoint, no token required
    const res = await api.get(`/languages?search=${encodeURIComponent(search)}`);
    languageSuggestions.value = res.data?.data || [];
  } catch (err) {
    console.error("Failed to fetch languages:", err);
    languageSuggestions.value = [];
  } finally {
    loadingLanguageOptions.value = false;
  }
}

function handleLanguageSearch(e) {
  languageForm.language_name = e.target.value;
  languageForm.language_id = null;
  clearTimeout(languageSearchTimeout);
  languageSearchTimeout = setTimeout(() => fetchLanguageOptions(e.target.value), 300);
}

function selectLanguageSuggestion(lang) {
  languageForm.language_id = lang.id;
  languageForm.language_name = lang.name;
  languageSuggestions.value = [];
}

function resetLanguageForm() {
  editingLanguageId.value = null;
  languageForm.language_id = null;
  languageForm.language_name = "";
  languageForm.proficiency_level_id = "";
  languageForm.is_primary = false;
  languageSuggestions.value = [];
}

function openLanguageForm(language = null) {
  editingLanguageId.value = language?.id || null;
  languageForm.language_id = language?.language_id ?? null;
  languageForm.language_name = language?.language_name || "";
  languageForm.proficiency_level_id = language?.proficiency_level_id
    ? String(language.proficiency_level_id)
    : "";
  languageForm.is_primary = Boolean(language?.is_primary);
  languageSuggestions.value = [];
  showLanguagePanel.value = true;
}

function closeLanguageForm() {
  showLanguagePanel.value = false;
  resetLanguageForm();
}

async function saveLanguage() {
  const name = languageForm.language_name.trim();
  if (!name || !languageForm.proficiency_level_id) {
    push.warning(t("profile.languageFormIncomplete"));
    return;
  }

  const isDuplicate = languages.value.some(
    (l) =>
      l.id !== editingLanguageId.value &&
      l.language_name?.trim().toLowerCase() === name.toLowerCase(),
  );
  if (isDuplicate) {
    push.warning(t("profile.languageAlreadyAdded"));
    return;
  }

  // Keep sending language_name for backward compatibility alongside language_id
  const payload = {
    language_name: name,
    proficiency_level_id: Number(languageForm.proficiency_level_id),
    is_primary: languageForm.is_primary,
  };
  if (languageForm.language_id) {
    payload.language_id = languageForm.language_id;
  }

  try {
    savingLanguage.value = true;
    const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

    if (editingLanguageId.value) {
      const currentId = editingLanguageId.value;
      await api.put(`/workers/languages/${currentId}`, payload, { headers });
      languages.value = languages.value.map((l) => {
        if (l.id !== currentId) {
          return payload.is_primary ? { ...l, is_primary: false } : l;
        }
        return { ...l, ...payload };
      });
      push.success(t("profile.languageUpdated"));
    } else {
      const res = await api.post("/workers/languages", payload, { headers });
      const created = { id: res.data?.data?.id, ...payload };
      if (payload.is_primary) {
        languages.value = languages.value.map((l) => ({
          ...l,
          is_primary: false,
        }));
      }
      languages.value.push(created);
      push.success(t("profile.languageAdded"));
    }
    closeLanguageForm();
  } catch (err) {
    push.error(err?.response?.data?.message || t("profile.failedToSaveLanguage"));
  } finally {
    savingLanguage.value = false;
  }
}

async function deleteLanguage(language) {
  try {
    await api.delete(`/workers/languages/${language.id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    languages.value = languages.value.filter((l) => l.id !== language.id);
    if (editingLanguageId.value === language.id) {
      closeLanguageForm();
    }
    push.success(t("profile.languageRemoved"));
  } catch (err) {
    push.error(err?.response?.data?.message || t("profile.failedToDeleteLanguage"));
  }
}

function onAvatarChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
     push.warning(t('profile.maxFileSize2MB'));
    return;
  }

  avatarFile.value = file;
  avatarPreview.value = URL.createObjectURL(file);
}

async function loadAppliedJobs() {
  appliedError.value = "";
  loadingApplied.value = true;

  const endpoint = "/job-posts/applied/self";
  ;

  try {
    // for (const endpoint of endpoints) {
      try {
        const res = await api.get(endpoint, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const data = res.data?.data || res.data || [];
        if (Array.isArray(data)) {
          appliedJobs.value = data;
          return;
        }
      } catch (err) {
        appliedError.value =
          err?.response?.data?.message || "Failed to load applied jobs";
      }
    // }

    appliedJobs.value = [];
  } finally {
    loadingApplied.value = false;
  }
}

async function loadSavedJobs() {
  savedError.value = "";
  loadingSaved.value = true;

  try {
    const res = await getSavedJobs();
    const data = res?.data ?? [];
    savedJobs.value = Array.isArray(data) ? data : [];
  } catch (err) {
    const message = err?.response?.data?.message || err?.message || "";
    const status = err?.response?.status;
    const messageText =
      typeof message === "string" ? message : message?.message || "";

    // Backend: list kosong atau join gagal sering jadi 404 / "not found"
    if (
      status === 404 ||
      /not found|tidak ditemukan|can not find/i.test(String(messageText))
    ) {
      savedJobs.value = [];
      return;
    }
    savedError.value = messageText || "Failed to load saved jobs";
    savedJobs.value = [];
  } finally {
    loadingSaved.value = false;
  }
}

async function handleRemoveSaved(job) {
  // Dari GET /workers/saved-jobs/self: id = saved_jobs.id, job_post_id = job post
  // DELETE /saved-jobs/:id butuh saved_jobs.id
  const savedJobId = job?.id;
  if (!savedJobId) return;

  try {
    await removeSavedJob(savedJobId);
    savedJobs.value = savedJobs.value.filter((item) => item?.id !== savedJobId);
    push.success(t("profile.removedFromSavedJobs"));
  } catch (err) {
    push.error(
      err?.response?.data?.message || t("profile.failedToRemoveSavedJob"),
    );
  }
}

const resumeFileInput = ref(null);

// CV Parser functions
function startCvParserCooldown(seconds = 60) {
  cvParserRateLimited.value = true;
  if (cvParserCooldownTimer) clearTimeout(cvParserCooldownTimer);
  cvParserCooldownTimer = setTimeout(() => {
    cvParserRateLimited.value = false;
    cvParserCooldownTimer = null;
  }, seconds * 1000);
}

async function parseCVFile() {
  if (cvParserLoading.value || cvParserRateLimited.value) return;

  const file = cvParserFileInput.value?.files?.[0];
  if (!file) {
    push.error(t('profile.cvParser.selectFile'));
    return;
  }
  const validTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (!validTypes.includes(file.type)) {
    push.error(t('profile.cvParser.invalidType'));
    return;
  }

  try {
    cvParserLoading.value = true;
    cvParserError.value = '';
    cvParsedData.value = null;

    const formData = new FormData();
    formData.append('cv', file);

    const res = await api.post('/workers/cv/parse', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    cvParsedData.value = res.data?.data || res.data;
  } catch (err) {
    if (isRateLimitedError(err)) {
      cvParserError.value = t("captcha.rateLimited");
      push.warning(cvParserError.value);
      startCvParserCooldown(60);
      return;
    }
    if (isContentRejectedError(err)) {
      cvParserError.value = t("contentRejected.upload");
      push.warning(cvParserError.value);
      return;
    }
    cvParserError.value = err?.response?.data?.message || t('profile.cvParser.failedToParse');
    push.error(cvParserError.value);
  } finally {
    cvParserLoading.value = false;
  }
}

function applyParsedPersonalInfo() {
  const d = cvParsedData.value;
  if (!d) return;
  if (d.name) form.name = d.name;
  if (d.phone || d.telephone) form.telephone = d.phone || d.telephone;
  if (d.address) form.address = d.address;
  if (d.summary || d.profile_summary) form.profile_summary = d.summary || d.profile_summary;
  if (d.date_of_birth) form.date_of_birth = formatDateForInput(d.date_of_birth);
  activeTab.value = 'profile';
  push.success(t('profile.cvParser.appliedPersonalInfo'));
}

function applyParsedWorkExp(exp) {
  workExperiences.value.unshift({
    company_name: exp.company_name || "",
    job_title: exp.job_title || "",
    start_date: formatDateForInput(exp.start_date),
    end_date: exp.is_current ? null : formatDateForInput(exp.end_date),
    is_current: exp.is_current || false,
    description: exp.description || "",
    _pending: true,
    _localKey: createLocalKey(),
  });
  activeTab.value = "work";
  push.success(t("profile.cvParser.appliedSection"));
}

function applyAllParsedWorkExp() {
  const exps = cvParsedData.value?.work_experiences || [];
  if (!exps.length) return;
  exps.forEach((exp) => {
    workExperiences.value.unshift({
      company_name: exp.company_name || "",
      job_title: exp.job_title || "",
      start_date: formatDateForInput(exp.start_date),
      end_date: exp.is_current ? null : formatDateForInput(exp.end_date),
      is_current: exp.is_current || false,
      description: exp.description || "",
      _pending: true,
      _localKey: createLocalKey(),
    });
  });
  activeTab.value = "work";
  push.success(t("profile.cvParser.appliedSection"));
}

function applyParsedEducation(edu) {
  educations.value.unshift({
    institution_name: edu.institution_name || "",
    degree: edu.degree || "",
    major: edu.major || "",
    start_date: formatDateForInput(edu.start_date),
    end_date: edu.is_current ? null : formatDateForInput(edu.end_date),
    is_current: edu.is_current || false,
    description: edu.description || "",
    _pending: true,
    _localKey: createLocalKey(),
  });
  activeTab.value = "education";
  push.success(t("profile.cvParser.appliedSection"));
}

function applyAllParsedEducation() {
  const edus = cvParsedData.value?.educations || [];
  if (!edus.length) return;
  edus.forEach((edu) => {
    educations.value.unshift({
      institution_name: edu.institution_name || "",
      degree: edu.degree || "",
      major: edu.major || "",
      start_date: formatDateForInput(edu.start_date),
      end_date: edu.is_current ? null : formatDateForInput(edu.end_date),
      is_current: edu.is_current || false,
      description: edu.description || "",
      _pending: true,
      _localKey: createLocalKey(),
    });
  });
  activeTab.value = "education";
  push.success(t("profile.cvParser.appliedSection"));
}

function applyParsedCertification(cert) {
  certifications.value.unshift({
    name: cert.name || "",
    issuer: cert.issuer || "",
    issue_date: formatDateForInput(cert.issue_date),
    expiry_date: formatDateForInput(cert.expiry_date),
    credential_id: cert.credential_id || "",
    link: cert.link || "",
    is_active: true,
    _pending: true,
    _localKey: createLocalKey(),
  });
  activeTab.value = "certifications";
  push.success(t("profile.cvParser.appliedSection"));
}

function applyAllParsedCertifications() {
  const certs = cvParsedData.value?.certifications || [];
  if (!certs.length) return;
  certs.forEach((cert) => {
    certifications.value.unshift({
      name: cert.name || "",
      issuer: cert.issuer || "",
      issue_date: formatDateForInput(cert.issue_date),
      expiry_date: formatDateForInput(cert.expiry_date),
      credential_id: cert.credential_id || "",
      link: cert.link || "",
      is_active: true,
      _pending: true,
      _localKey: createLocalKey(),
    });
  });
  activeTab.value = "certifications";
  push.success(t("profile.cvParser.appliedSection"));
}

function goToJobDetail(job) {
  const jobId = job?.job_post_id || job?.id;
//   console.log("Navigating to job ID:", jobId);/s
  if (!jobId) return;
  router.push(`/jobposts/${jobId}`);
}

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatNumber(num) {
  return new Intl.NumberFormat("en-US").format(num);
}

async function fetchCurrencies(keyword = "_") {
  try {
    currencyLoading.value = true;
    const res = await api.get(`/currencies/${keyword}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = res?.data?.data || [];
    currencyOptions.value = data.map((item) => ({
      id: item.id,
      name: item.name,
      code: item.code,
      symbol: item.symbol,
    }));
  } catch (err) {
    console.error("Failed to fetch currencies:", err);
    currencyOptions.value = [];
  } finally {
    currencyLoading.value = false;
  }
}

function selectCurrentCurrency(currency) {
  isSelectingCurrentCurrency.value = true;
  form.current_salary_currency_id = String(currency.id);
  currentCurrencyInput.value = `${currency.name} (${currency.code})`;
  currencyOptions.value = [];
  showCurrentCurrencyDropdown.value = false;
  setTimeout(() => {
    isSelectingCurrentCurrency.value = false;
  }, 0);
}

function selectExpectedCurrency(currency) {
  isSelectingExpectedCurrency.value = true;
  form.expected_salary_currency_id = String(currency.id);
  expectedCurrencyInput.value = `${currency.name} (${currency.code})`;
  currencyOptions.value = [];
  showExpectedCurrencyDropdown.value = false;
  setTimeout(() => {
    isSelectingExpectedCurrency.value = false;
  }, 0);
}

async function setDefaultCurrencies() {
  try {
    const res = await api.get(`/currencies/${DEFAULT_CURRENCY_CODE}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const data = res?.data?.data || [];
    const list = Array.isArray(data) ? data : [data];
    const idr =
      list.find((c) => String(c.code).toUpperCase() === DEFAULT_CURRENCY_CODE) ||
      list[0];
    if (!idr) return;

    if (!form.current_salary_currency_id) {
      selectCurrentCurrency(idr);
    }
    if (!form.expected_salary_currency_id) {
      selectExpectedCurrency(idr);
    }
  } catch (err) {
    console.error("Failed to set default currencies:", err);
  }
}

watch(currentCurrencyInput, (val) => {
  if (isSelectingCurrentCurrency.value) return;

  if (!val || val.trim() === "") {
    currencyOptions.value = [];
    return;
  }

  // Only search if dropdown is open
  if (showCurrentCurrencyDropdown.value) {
    clearTimeout(currentCurrencyTimeout);
    currentCurrencyTimeout = setTimeout(() => {
      fetchCurrencies(val);
    }, 300);
  }
});

watch(expectedCurrencyInput, (val) => {
  if (isSelectingExpectedCurrency.value) return;

  if (!val || val.trim() === "") {
    currencyOptions.value = [];
    return;
  }

  // Only search if dropdown is open
  if (showExpectedCurrencyDropdown.value) {
    clearTimeout(expectedCurrencyTimeout);
    expectedCurrencyTimeout = setTimeout(() => {
      fetchCurrencies(val);
    }, 300);
  }
});

function toggleCurrentCurrencyDropdown() {
  showCurrentCurrencyDropdown.value = !showCurrentCurrencyDropdown.value;
  if (showCurrentCurrencyDropdown.value && !currencyOptions.value.length) {
    fetchCurrencies(currentCurrencyInput.value || "_");
  }
}

function toggleExpectedCurrencyDropdown() {
  showExpectedCurrencyDropdown.value = !showExpectedCurrencyDropdown.value;
  if (showExpectedCurrencyDropdown.value && !currencyOptions.value.length) {
    fetchCurrencies(expectedCurrencyInput.value || "_");
  }
}

function handleClickOutside(event) {
  const currentDropdown = document.querySelector('.currency-dropdown-current');
  const expectedDropdown = document.querySelector('.currency-dropdown-expected');
  
  if (currentDropdown && !currentDropdown.contains(event.target)) {
    showCurrentCurrencyDropdown.value = false;
  }
  
  if (expectedDropdown && !expectedDropdown.contains(event.target)) {
    showExpectedCurrencyDropdown.value = false;
  }
}

async function fetchNationalities(keyword = "") {
  try {
    const query = keyword ? `?search=${encodeURIComponent(keyword)}` : "";

    const res = await api.get(`/nationalities${query}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const mapped =
      res?.data?.data?.map((item) => ({
        id: item.id,
        country_name: item.country_name,
        iso_alpha3: item.iso_alpha3,
        label: `${item.country_name} (${item.iso_alpha3})`,
      })) || [];

    nationalities.value = mapped;
  } catch (err) {
    console.error("Failed to fetch nationalities:", err);
  }
}

function handleNationalitySearch(value) {
  nationalitySearch.value = value;
  fetchNationalities(value);
}

onMounted(() => {
  fetchCurrencies();
  fetchNationalities();
  loadProfile();
  loadAppliedJobs();
  loadSavedJobs();
  
  // Add click outside listener
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  // Clean up event listener
  document.removeEventListener('click', handleClickOutside);
});

watch(activeTab, (newTab) => {
  localStorage.setItem("profileActiveTab", newTab);
});
</script>

<template>
  <div class="bg-slate-50 min-h-screen py-6 md:py-10">
    <div class="max-w-6xl mx-auto px-3 md:px-4 sm:max-w-md md:max-w-2xl lg:max-w-4xl">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-xl md:text-2xl font-semibold text-slate-900">{{ $t('profile.myProfile') }}</h1>
          <p class="text-sm text-slate-500 mt-1">
            {{ $t('profile.manageProfile') }}
          </p>
        </div>
        <RouterLink
          to="/change-password"
          class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 transition duration-200 text-center min-h-11"
        >
          {{ $t('profile.changePassword') }}
        </RouterLink>
      </div>

      <div
        class="bg-white w-full rounded-2xl shadow-sm border border-slate-100 p-1.5 flex gap-1 mb-6 md:mb-8 overflow-x-auto flex-nowrap scrollbar-thin"
      >
        <button
          v-for="tab in profileTabs"
          :key="tab.id"
          type="button"
          class="px-3 md:px-4 py-2 text-xs md:text-sm rounded-xl whitespace-nowrap min-h-10 transition duration-200 shrink-0"
          :class="
            activeTab === tab.id
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          "
          @click="activeTab = tab.id"
        >
          <span class="hidden sm:inline">{{ tab.label }}</span>
          <span class="sm:hidden">{{ tab.shortLabel || tab.label }}</span>
        </button>
      </div>

      <!-- PERSONAL INFO TAB -->
      <div
        v-if="activeTab === 'profile'"
        class="space-y-6"
      >
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6">
        <div class="mb-5">
          <h2 class="text-lg md:text-xl font-semibold text-slate-900">
            {{ $t('profile.personalInfo') }}
          </h2>
          <p class="text-sm text-slate-500 mt-1">{{ $t('profile.personalInfoHint') }}</p>
        </div>

        <div v-if="loadingProfile" class="text-sm text-slate-500 py-8 text-center">
          {{ $t('profile.loadingProfile') }}
        </div>

        <form v-else class="space-y-8" @submit.prevent="saveProfile">
          <!-- Avatar Section -->
          <div class="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6 pb-6 border-b border-slate-100">
            <div class="relative shrink-0">
              <div
                class="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 ring-4 ring-slate-50"
              >
                <img
                  v-if="avatarPreview || avatarFromBackend"
                  :src="
                    avatarPreview || `${linkStorageUrl}${avatarFromBackend}`
                  "
                  class="h-full w-full object-cover"
                />
                <div
                  v-else
                  class="h-full w-full flex items-center justify-center bg-blue-50 text-blue-600 text-xl sm:text-2xl md:text-3xl font-bold"
                >
                  {{ form.name?.charAt(0)?.toUpperCase() || "?" }}
                </div>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <label class="mb-1.5 block text-sm font-medium text-slate-700"
                >{{ $t('profile.profilePhoto') }}</label
              >
              <input
                type="file"
                accept="image/*"
                @change="onAvatarChange"
                class="w-full text-sm rounded-xl border border-slate-200 bg-white px-3 py-2.5 min-h-11 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700"
              />
              <p class="text-xs text-slate-500 mt-1.5">{{ $t('profile.jpgOrPngMax2MB') }}</p>
            </div>
          </div>

          <!-- Basic contact -->
          <section class="space-y-4">
            <div>
              <h3 class="text-sm font-semibold text-slate-900">{{ $t('profile.sectionBasic') }}</h3>
              <p class="text-xs text-slate-500 mt-0.5">{{ $t('profile.sectionBasicHint') }}</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="mb-1.5 block text-sm font-medium text-slate-700"
                  >{{ $t('profile.fullNameLabel') }} <span class="text-red-600">*</span></label
                >
                <input
                  v-model="form.name"
                  type="text"
                  class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  :placeholder="$t('profile.yourNamePlaceholder')"
                  required
                />
              </div>

              <div v-if="isTelegramLogin">
                <label class="mb-1.5 block text-sm font-medium text-slate-700">
                  {{ $t('profile.email') }}
                </label>
                <p class="mt-0 text-sm text-slate-600 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 min-h-11 flex items-center">
                  {{ $t('profile.telegramNotificationsOnly') }}
                </p>
              </div>
              <div v-else>
                <label class="mb-1.5 block text-sm font-medium text-slate-700">
                  {{ $t('profile.email') }}
                  <span class="text-red-600">*</span>
                </label>
                <input
                  v-model="form.email"
                  type="email"
                  class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  :class="{ 'bg-slate-50 text-slate-500': !canEditEmail }"
                  :placeholder="$t('profile.email')"
                  :readonly="!canEditEmail"
                />
                <p v-if="isGoogleLogin" class="text-xs text-slate-500 mt-1.5">
                  {{ $t('profile.emailManagedByGoogle') }}
                </p>
                <button
                  v-if="canEditEmail"
                  type="button"
                  class="mt-2 inline-flex items-center justify-center rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition duration-200 disabled:opacity-50 min-h-10"
                  :disabled="savingEmail"
                  @click="saveAccountEmail"
                >
                  {{ savingEmail ? $t('auth.buttons.sending') : $t('profile.updateEmail') }}
                </button>
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700">{{ $t('profile.phone') }} <span class="text-red-600">*</span></label>
                <input
                  v-model="form.telephone"
                  type="text"
                  class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  :placeholder="$t('profile.phone')"
                />
              </div>
            </div>
          </section>

          <!-- Demographics -->
          <section class="space-y-4 border-t border-slate-100 pt-6">
            <div>
              <h3 class="text-sm font-semibold text-slate-900">{{ $t('profile.sectionDemographics') }}</h3>
              <p class="text-xs text-slate-500 mt-0.5">{{ $t('profile.sectionDemographicsHint') }}</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700"
                  >{{ $t('profile.dateOfBirth') }} <span class="text-red-600">*</span></label
                >
                <input
                  v-model="form.date_of_birth"
                  type="date"
                  class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700">{{ $t('profile.gender') }} <span class="text-red-600">*</span></label>
                <select
                  v-model="form.gender_id"
                  class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                >
                  <option value="">{{ $t('profile.selectGender') }}</option>
                  <option v-for="g in genders" :key="g.id" :value="g.id">
                    {{ g.name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700"
                  >{{ $t('profile.nationality') }}
                  <span class="text-red-600">*</span>
                  </label
                >
                <SearchableSelect
                  :options="nationalityOptions"
                  :value="form.nationality_id"
                  :placeholder="$t('profile.searchNationality')"
                  @change="(val) => (form.nationality_id = String(val || ''))"
                  @search="handleNationalitySearch"
                />
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700">{{ $t('profile.religion') }}
                  <span class="text-red-600">*</span>
                </label>
                <select
                  v-model="form.religion_id"
                  class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                >
                  <option value="">{{ $t('profile.selectReligion') }}</option>
                  <option v-for="r in religions" :key="r.id" :value="r.id">
                    {{ r.name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700"
                  >{{ $t('profile.maritalStatus') }} <span class="text-red-600">*</span></label
                >
                <select
                  v-model="form.marriage_status_id"
                  class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                >
                  <option value="">{{ $t('profile.selectStatus') }}</option>
                  <option v-for="m in maritalStatuses" :key="m.id" :value="m.id">
                    {{ m.status }}
                  </option>
                </select>
              </div>
            </div>
          </section>

          <!-- Compensation -->
          <section class="space-y-4 border-t border-slate-100 pt-6">
            <div>
              <h3 class="text-sm font-semibold text-slate-900">{{ $t('profile.sectionCompensation') }}</h3>
              <p class="text-xs text-slate-500 mt-0.5">{{ $t('profile.sectionCompensationHint') }}</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="mb-1.5 block text-sm font-medium text-slate-700"
                  >{{ $t('profile.currentSalary') }}
                  <span class="text-red-600">*</span>
                  </label
                >
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <MaskedNumberInput
                    v-model="form.current_salary"
                    :placeholder="$t('profile.salaryExample')"
                    input-class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                  <div class="relative currency-dropdown-current">
                    <input
                      v-model="currentCurrencyInput"
                      type="text"
                      class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 cursor-pointer"
                      :placeholder="$t('profile.selectCurrency') || 'Select Currency'"
                      @click="toggleCurrentCurrencyDropdown"
                    />
                    <div
                      v-if="showCurrentCurrencyDropdown && currencyOptions.length"
                      class="absolute z-10 bg-white shadow-lg w-full mt-1 max-h-48 overflow-y-auto border border-slate-200 rounded-xl"
                    >
                      <div
                        v-for="currency in currencyOptions"
                        :key="currency.id"
                        @click="selectCurrentCurrency(currency)"
                        class="px-3 py-2.5 text-sm cursor-pointer hover:bg-blue-50 text-slate-800"
                          >
                          {{ currency.name }} ({{ currency.code }})
                      </div>
                    </div>
                    <p v-if="currencyLoading" class="text-xs text-slate-500 mt-1">
                      {{ $t('profile.loadingCurrencies') || 'Loading...' }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="md:col-span-2">
                <label class="mb-1.5 block text-sm font-medium text-slate-700"
                  >{{ $t('profile.expectedSalary') }}
                  <span class="text-red-600">*</span>
                  </label
                >
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <MaskedNumberInput
                    v-model="form.expected_salary"
                    :placeholder="$t('profile.salaryExample')"
                    input-class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                  <div class="relative currency-dropdown-expected">
                    <input
                      v-model="expectedCurrencyInput"
                      type="text"
                      class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 cursor-pointer"
                      :placeholder="$t('profile.selectCurrency') || 'Select Currency'"
                      @click="toggleExpectedCurrencyDropdown"
                    />
                    <div
                      v-if="showExpectedCurrencyDropdown && currencyOptions.length"
                      class="absolute z-10 bg-white shadow-lg w-full mt-1 max-h-48 overflow-y-auto border border-slate-200 rounded-xl"
                    >
                      <div
                        v-for="currency in currencyOptions"
                        :key="currency.id"
                        @click="selectExpectedCurrency(currency)"
                        class="px-3 py-2.5 text-sm cursor-pointer hover:bg-blue-50 text-slate-800"
                      >
                        {{ currency.name }} ({{ currency.code }})
                      </div>
                    </div>
                    <p v-if="currencyLoading" class="text-xs text-slate-500 mt-1">
                      {{ $t('profile.loadingCurrencies') || 'Loading...' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- About -->
          <section class="space-y-4 border-t border-slate-100 pt-6">
            <div>
              <h3 class="text-sm font-semibold text-slate-900">{{ $t('profile.sectionAbout') }}</h3>
              <p class="text-xs text-slate-500 mt-0.5">{{ $t('profile.sectionAboutHint') }}</p>
            </div>
            <div class="space-y-4">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700">{{ $t('profile.address') }} <span class="text-red-600">*</span></label>
                <textarea
                  v-model="form.address"
                  rows="2"
                  class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  :placeholder="$t('profile.yourAddress')"
                />
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700"
                  >{{ $t('profile.profileSummary') }}
                  <span class="text-red-600">*</span>
                  </label
                >
                <RichTextEditor
                  v-model="form.profile_summary"
                  :placeholder="$t('profile.profileSummaryPlaceholder')"
                  min-height="140px"
                />
              </div>
            </div>
          </section>

          <!-- Skills Section -->
          <section class="border-t border-slate-100 pt-6">
            <div class="mb-3">
              <label class="block text-sm font-semibold text-slate-900">
                {{ $t('profile.skills') }}
                <span class="ml-2 text-xs text-slate-400 font-normal">{{ $t('optional') }}</span>
              </label>
              <p class="text-xs text-slate-500 mt-0.5">
                {{ $t('profile.skillsSectionHint') }}
              </p>
            </div>

            <div
              v-if="skills.length === 0 && !showSkillModal"
              class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500"
            >
              {{ $t('profile.noSkillsAdded') }}
            </div>

            <ul v-else-if="skills.length > 0" class="flex flex-wrap gap-2">
              <li
                v-for="skill in skills"
                :key="skill.id || skill.skill_id"
                class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800"
              >
                <span>{{ skill.skill_name || skill.name }}</span>
                <button
                  type="button"
                  class="rounded-md p-0.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                  :aria-label="$t('profile.remove')"
                  @click="deleteSkill(skill)"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            </ul>

            <div
              v-if="showSkillModal"
              class="mt-3 rounded-2xl border border-blue-100 bg-slate-50 p-4 space-y-3"
            >
              <div class="flex items-center justify-between gap-2">
                <h3 class="text-sm font-semibold text-slate-900">
                  {{ $t('profile.addSkillsButton') }}
                </h3>
                <button
                  type="button"
                  class="text-slate-400 hover:text-slate-600 text-xl leading-none px-1"
                  :aria-label="$t('profile.cancel')"
                  @click="closeSkillModal"
                >
                  ×
                </button>
              </div>

              <input
                v-model="skillSearchQuery"
                @input="handleSkillSearch"
                @keydown.enter.prevent="handleSkillEnter"
                type="text"
                :placeholder="$t('profile.searchOrCreateSkill')"
                class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />

              <div
                v-if="skillSuggestions.length"
                class="space-y-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white"
              >
                <button
                  v-for="skill in skillSuggestions"
                  :key="skill.id"
                  type="button"
                  @click="addSkillFromSuggestion(skill)"
                  class="w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 text-slate-800 transition"
                >
                  {{ skill.name }}
                </button>
              </div>

              <div v-if="skillSearchQuery && !skillSuggestions.length && !loadingSkills">
                <button
                  type="button"
                  @click="createAndAddSkill(skillSearchQuery)"
                  class="w-full rounded-xl border border-dashed border-blue-300 bg-blue-50/50 px-3 py-2.5 text-sm text-blue-700 hover:bg-blue-50 transition"
                >
                  + {{ $t('profile.createSkill') }} "{{ skillSearchQuery }}"
                </button>
              </div>

              <p v-if="loadingSkills" class="text-xs text-slate-500 text-center">
                {{ $t('profile.loadingSkills') }}
              </p>

              <div class="flex flex-col-reverse sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  class="sm:flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 transition duration-200 min-h-11"
                  @click="closeSkillModal"
                >
                  {{ $t('profile.done') }}
                </button>
              </div>
            </div>

            <button
              v-if="!showSkillModal"
              type="button"
              class="mt-3 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition duration-200 min-h-11"
              @click="openSkillModal"
            >
              + {{ $t('profile.addSkillsButton') }}
            </button>
          </section>

          <!-- Languages Section -->
          <section class="border-t border-slate-100 pt-6">
            <div class="mb-3">
              <label class="block text-sm font-semibold text-slate-900">
                {{ $t('profile.languages') }}
                <span class="ml-2 text-xs text-slate-400 font-normal">{{ $t('optional') }}</span>
              </label>
              <p class="text-xs text-slate-500 mt-0.5">
                {{ $t('profile.languagesHint') }}
              </p>
            </div>

            <div
              v-if="languages.length === 0 && !showLanguagePanel"
              class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500"
            >
              {{ $t('profile.noLanguagesAdded') }}
            </div>

            <ul v-else-if="languages.length > 0" class="space-y-2">
              <li
                v-for="language in languages"
                :key="language.id"
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5"
                :class="{
                  'ring-1 ring-blue-200 border-blue-200':
                    editingLanguageId === language.id && showLanguagePanel,
                }"
              >
                <div class="min-w-0 flex flex-wrap items-center gap-2">
                  <span class="text-sm font-semibold text-slate-900">
                    {{ language.language_name }}
                  </span>
                  <span class="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {{ proficiencyLabel(language.proficiency_level_id) }}
                  </span>
                  <span
                    v-if="language.is_primary"
                    class="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200"
                  >
                    {{ $t('profile.primaryLanguage') }}
                  </span>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    class="rounded-xl px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 transition duration-200"
                    @click="openLanguageForm(language)"
                  >
                    {{ $t('profile.edit') }}
                  </button>
                  <button
                    type="button"
                    class="rounded-xl px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition duration-200"
                    @click="deleteLanguage(language)"
                  >
                    {{ $t('profile.remove') }}
                  </button>
                </div>
              </li>
            </ul>

            <div
              v-if="showLanguagePanel"
              class="mt-3 rounded-2xl border border-blue-100 bg-slate-50 p-4 space-y-3"
            >
              <div class="flex items-center justify-between gap-2">
                <h3 class="text-sm font-semibold text-slate-900">
                  {{
                    editingLanguageId
                      ? $t('profile.editLanguage')
                      : $t('profile.addLanguageButton')
                  }}
                </h3>
                <button
                  type="button"
                  class="text-slate-400 hover:text-slate-600 text-xl leading-none px-1"
                  :aria-label="$t('profile.cancel')"
                  @click="closeLanguageForm"
                >
                  ×
                </button>
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700">
                  {{ $t('profile.languageName') }}
                </label>
                <div class="relative">
                  <input
                    :value="languageForm.language_name"
                    type="text"
                    autocomplete="off"
                    :placeholder="$t('profile.searchOrTypeLanguage')"
                    class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    @input="handleLanguageSearch"
                  />
                  <div
                    v-if="languageSuggestions.length"
                    class="absolute z-10 bg-white shadow-lg w-full mt-1 max-h-48 overflow-y-auto border border-slate-200 rounded-xl"
                  >
                    <button
                      v-for="lang in languageSuggestions"
                      :key="lang.id"
                      type="button"
                      class="w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 text-slate-800"
                      @click="selectLanguageSuggestion(lang)"
                    >
                      {{ lang.name }}
                    </button>
                  </div>
                  <p v-if="loadingLanguageOptions" class="text-xs text-slate-500 mt-1">
                    {{ $t('profile.loadingLanguages') }}
                  </p>
                </div>
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700">
                  {{ $t('profile.proficiencyLevel') }}
                </label>
                <select
                  v-model="languageForm.proficiency_level_id"
                  class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                >
                  <option value="" disabled>
                    {{ $t('profile.selectProficiency') }}
                  </option>
                  <option
                    v-for="level in proficiencyOptions"
                    :key="level.id"
                    :value="String(level.id)"
                  >
                    {{ level.label }}
                  </option>
                </select>
              </div>

              <label class="flex items-center gap-2 text-sm text-slate-700">
                <input
                  v-model="languageForm.is_primary"
                  type="checkbox"
                  class="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                />
                {{ $t('profile.setAsPrimaryLanguage') }}
              </label>

              <div class="flex flex-col-reverse sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  class="sm:flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 transition duration-200 min-h-11"
                  @click="closeLanguageForm"
                >
                  {{ $t('profile.cancel') }}
                </button>
                <button
                  type="button"
                  class="sm:flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition duration-200 min-h-11 disabled:opacity-50"
                  :disabled="savingLanguage"
                  @click="saveLanguage"
                >
                  {{ savingLanguage ? $t('profile.saving') : $t('profile.save') }}
                </button>
              </div>
            </div>

            <button
              v-if="!showLanguagePanel"
              type="button"
              class="mt-3 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition duration-200 min-h-11"
              @click="openLanguageForm()"
            >
              + {{ $t('profile.addLanguageButton') }}
            </button>
          </section>

          <div class="flex justify-end gap-2 pt-4 border-t border-slate-100 flex-col-reverse sm:flex-row">
            <button
              type="submit"
              class="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition duration-200 min-h-11 disabled:opacity-50"
              :disabled="savingProfile"
            >
              {{ savingProfile ? $t('profile.saving') : $t('profile.saveChanges') }}
            </button>
          </div>
        </form>
        </div>

        <JobAlertsCard />
        <CommunicationPreferencesCard />
      </div>

      <!-- RESUMES TAB -->
      <div
        v-else-if="activeTab === 'resumes'"
        class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6"
      >
        <div class="mb-5">
          <h2 class="text-lg md:text-xl font-semibold text-slate-900">
            {{ $t('profile.manageResumes') }}
          </h2>
          <p class="text-sm text-slate-500 mt-1">{{ $t('profile.resumesHint') }}</p>
        </div>

        <div
          class="mb-4 inline-flex items-center rounded-xl bg-blue-50 px-3 py-1.5 text-xs md:text-sm font-medium text-blue-700"
        >
          {{ $t('profile.resumesCount', { current: resumes.length, limit: RESUME_LIMIT }) }}
        </div>

        <div
          class="rounded-2xl border border-slate-200 bg-slate-50 p-4 mb-5 space-y-3"
          :class="{ 'opacity-50 pointer-events-none': resumes.length >= RESUME_LIMIT }"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700">
                {{ $t('profile.uploadPDF') }} <span class="text-red-600">*</span>
              </label>
              <input
                ref="resumeFileInput"
                type="file"
                accept="application/pdf"
                class="w-full text-sm rounded-xl border border-slate-200 bg-white px-3 py-2.5 min-h-11 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700"
                :disabled="resumes.length >= RESUME_LIMIT"
                @change="onResumeFileChange"
              />
              <p class="text-xs text-slate-500 mt-1">{{ $t('profile.maxSize5MB') }}</p>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700">
                {{ $t('profile.title') }} <span class="text-red-600">*</span>
              </label>
              <input
                v-model="resumeTitle"
                type="text"
                class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                :placeholder="$t('profile.professionalResume')"
                :disabled="resumes.length >= RESUME_LIMIT"
              />
            </div>
          </div>
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <label class="flex items-center gap-2 text-sm text-slate-700">
              <input
                v-model="resumeAsDefault"
                type="checkbox"
                class="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                :disabled="resumes.length >= RESUME_LIMIT"
              />
              {{ $t('profile.setAsDefault') }}
            </label>
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition duration-200 min-h-11 disabled:bg-slate-300 disabled:cursor-not-allowed"
              :disabled="resumes.length >= RESUME_LIMIT || uploadingResume"
              @click="handleAddResume"
            >
              {{
                resumes.length >= RESUME_LIMIT
                  ? $t('profile.maxResumesReached', { limit: RESUME_LIMIT })
                  : uploadingResume
                    ? $t('profile.saving')
                    : $t('profile.addResume')
              }}
            </button>
          </div>
        </div>

        <div
          v-if="resumes.length === 0"
          class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500"
        >
          {{ $t('profile.noResumesUploaded') }}
        </div>
        <ul v-else class="space-y-2">
          <li
            v-for="resume in resumes"
            :key="resume.id"
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5"
          >
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="font-semibold text-sm text-slate-900 truncate">{{ resume.title }}</h3>
                <span
                  v-if="resume.is_default"
                  class="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200"
                >
                  {{ $t('profile.primaryButton') }}
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-1">
                {{ resume.created_at ? formatDate(resume.created_at) : "" }}
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2 shrink-0">
              <a
                :href="resolveUploadUrl(resume.resume_url)"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 transition duration-200"
              >
                {{ $t('profile.view') }}
              </a>
              <button
                v-if="!resume.is_default"
                type="button"
                class="rounded-xl px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 transition duration-200"
                @click="setPrimaryResume(resume.id)"
              >
                {{ $t('profile.primaryButton') }}
              </button>
              <button
                type="button"
                class="rounded-xl px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition duration-200"
                @click="removeResume(resume.id)"
              >
                {{ $t('profile.remove') }}
              </button>
            </div>
          </li>
        </ul>
      </div>

      <!-- WORK EXPERIENCE TAB -->
      <div
        v-else-if="activeTab === 'work'"
        class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6"
      >
        <div class="mb-5">
          <h2 class="text-lg md:text-xl font-semibold text-slate-900">
            {{ $t('profile.workExperience') }}
          </h2>
          <p class="text-sm text-slate-500 mt-1">{{ $t('profile.workExperienceHint') }}</p>
        </div>

        <div
          v-if="workExperiences.length === 0 && !showWorkPanel"
          class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500"
        >
          {{ $t('profile.noWorkExperienceAdded') }}
        </div>

        <ul v-else-if="workExperiences.length > 0" class="space-y-2">
          <li
            v-for="work in workExperiences"
            :key="profileItemKey(work)"
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5"
            :class="{
              'ring-1 ring-blue-200 border-blue-200':
                editingWorkKey === profileItemKey(work) && showWorkPanel,
            }"
          >
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-sm font-semibold text-slate-900">
                  {{ work.job_title || $t('profile.jobTitle') }}
                </h3>
                <span
                  v-if="work._pending"
                  class="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200"
                >
                  {{ $t('profile.unsavedDraft') }}
                </span>
              </div>
              <p class="text-sm text-slate-600 mt-0.5">
                {{ work.company_name || $t('profile.companyName') }}
              </p>
              <p class="text-xs text-slate-500 mt-1">
                {{ formatProfileDateRange(work.start_date, work.end_date, work.is_current) }}
              </p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                class="rounded-xl px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 transition duration-200"
                @click="openWorkForm(work)"
              >
                {{ $t('profile.edit') }}
              </button>
              <button
                type="button"
                class="rounded-xl px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition duration-200"
                @click="deleteWorkExp(work)"
              >
                {{ $t('profile.delete') }}
              </button>
            </div>
          </li>
        </ul>

        <div
          v-if="showWorkPanel"
          class="mt-4 rounded-2xl border border-blue-100 bg-slate-50 p-4 space-y-3"
        >
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold text-slate-900">
              {{ editingWorkKey ? $t('profile.editExperience') : $t('profile.addExperience') }}
            </h3>
            <button
              type="button"
              class="text-slate-400 hover:text-slate-600 text-xl leading-none px-1"
              :aria-label="$t('profile.cancel')"
              @click="closeWorkForm"
            >
              ×
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              v-model="workForm.company_name"
              type="text"
              :placeholder="$t('profile.companyName')"
              class="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
            <input
              v-model="workForm.job_title"
              type="text"
              :placeholder="$t('profile.jobTitle')"
              class="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
            <input
              v-model="workForm.start_date"
              type="date"
              class="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
            <input
              v-model="workForm.end_date"
              type="date"
              :disabled="workForm.is_current"
              class="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-400"
            />
          </div>
          <label class="flex items-center gap-2 text-sm text-slate-700">
            <input
              v-model="workForm.is_current"
              type="checkbox"
              class="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
            />
            {{ $t('profile.currentlyWorkingHere') }}
          </label>
          <RichTextEditor
            v-model="workForm.description"
            :placeholder="$t('profile.descriptionPlaceholder')"
            min-height="120px"
          />
          <div class="flex flex-col-reverse sm:flex-row gap-2 pt-1">
            <button
              type="button"
              class="sm:flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 transition duration-200 min-h-11"
              @click="closeWorkForm"
            >
              {{ $t('profile.cancel') }}
            </button>
            <button
              type="button"
              class="sm:flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition duration-200 min-h-11 disabled:opacity-50"
              :disabled="savingWork"
              @click="saveWorkExp"
            >
              {{ savingWork ? $t('profile.saving') : $t('profile.save') }}
            </button>
          </div>
        </div>

        <button
          v-if="!showWorkPanel"
          type="button"
          class="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition duration-200 min-h-11"
          @click="openWorkForm()"
        >
          + {{ $t('profile.addExperience') }}
        </button>
      </div>

      <!-- EDUCATION TAB -->
      <div
        v-else-if="activeTab === 'education'"
        class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6"
      >
        <div class="mb-5">
          <h2 class="text-lg md:text-xl font-semibold text-slate-900">
            {{ $t('education') }}
          </h2>
          <p class="text-sm text-slate-500 mt-1">{{ $t('profile.educationHint') }}</p>
        </div>

        <div
          v-if="educations.length === 0 && !showEducationPanel"
          class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500"
        >
          {{ $t('profile.noEducationAdded') }}
        </div>

        <ul v-else-if="educations.length > 0" class="space-y-2">
          <li
            v-for="edu in educations"
            :key="profileItemKey(edu)"
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5"
            :class="{
              'ring-1 ring-blue-200 border-blue-200':
                editingEducationKey === profileItemKey(edu) && showEducationPanel,
            }"
          >
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-sm font-semibold text-slate-900">
                  {{ edu.institution_name || $t('profile.institution') }}
                </h3>
                <span
                  v-if="edu._pending"
                  class="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200"
                >
                  {{ $t('profile.unsavedDraft') }}
                </span>
              </div>
              <p class="text-sm text-slate-600 mt-0.5">
                {{ [edu.degree, edu.major].filter(Boolean).join(' · ') || $t('profile.degree') }}
              </p>
              <p class="text-xs text-slate-500 mt-1">
                {{ formatProfileDateRange(edu.start_date, edu.end_date, edu.is_current) }}
              </p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                class="rounded-xl px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 transition duration-200"
                @click="openEducationForm(edu)"
              >
                {{ $t('profile.edit') }}
              </button>
              <button
                type="button"
                class="rounded-xl px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition duration-200"
                @click="deleteEducation(edu)"
              >
                {{ $t('profile.delete') }}
              </button>
            </div>
          </li>
        </ul>

        <div
          v-if="showEducationPanel"
          class="mt-4 rounded-2xl border border-blue-100 bg-slate-50 p-4 space-y-3"
        >
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold text-slate-900">
              {{ editingEducationKey ? $t('profile.editEducation') : $t('profile.addEducation') }}
            </h3>
            <button
              type="button"
              class="text-slate-400 hover:text-slate-600 text-xl leading-none px-1"
              :aria-label="$t('profile.cancel')"
              @click="closeEducationForm"
            >
              ×
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              v-model="educationForm.institution_name"
              type="text"
              :placeholder="$t('profile.institution')"
              class="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
            <input
              v-model="educationForm.degree"
              type="text"
              :placeholder="$t('profile.degree')"
              class="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
            <input
              v-model="educationForm.major"
              type="text"
              :placeholder="$t('profile.major')"
              class="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
            <input
              v-model="educationForm.start_date"
              type="date"
              class="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
            <input
              v-model="educationForm.end_date"
              type="date"
              :disabled="educationForm.is_current"
              class="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-400"
            />
          </div>
          <label class="flex items-center gap-2 text-sm text-slate-700">
            <input
              v-model="educationForm.is_current"
              type="checkbox"
              class="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
            />
            {{ $t('profile.currentlyStudyingHere') }}
          </label>
          <RichTextEditor
            v-model="educationForm.description"
            :placeholder="$t('profile.descriptionPlaceholder')"
            min-height="100px"
          />
          <div class="flex flex-col-reverse sm:flex-row gap-2 pt-1">
            <button
              type="button"
              class="sm:flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 transition duration-200 min-h-11"
              @click="closeEducationForm"
            >
              {{ $t('profile.cancel') }}
            </button>
            <button
              type="button"
              class="sm:flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition duration-200 min-h-11 disabled:opacity-50"
              :disabled="savingEducation"
              @click="saveEducation"
            >
              {{ savingEducation ? $t('profile.saving') : $t('profile.save') }}
            </button>
          </div>
        </div>

        <button
          v-if="!showEducationPanel"
          type="button"
          class="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition duration-200 min-h-11"
          @click="openEducationForm()"
        >
          + {{ $t('profile.addEducation') }}
        </button>
      </div>

      <!-- CERTIFICATIONS TAB -->
      <div
        v-else-if="activeTab === 'certifications'"
        class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6"
      >
        <div class="mb-5">
          <h2 class="text-lg md:text-xl font-semibold text-slate-900">
            {{ $t('profile.certifications') }}
          </h2>
          <p class="text-sm text-slate-500 mt-1">{{ $t('profile.certificationsHint') }}</p>
        </div>

        <div
          v-if="certifications.length === 0 && !showCertificationPanel"
          class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500"
        >
          {{ $t('profile.noCertificationsAdded') }}
        </div>

        <ul v-else-if="certifications.length > 0" class="space-y-2">
          <li
            v-for="cert in certifications"
            :key="profileItemKey(cert)"
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5"
            :class="{
              'ring-1 ring-blue-200 border-blue-200':
                editingCertificationKey === profileItemKey(cert) && showCertificationPanel,
            }"
          >
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-sm font-semibold text-slate-900">
                  {{ cert.name || $t('profile.certificationName') }}
                </h3>
                <span
                  v-if="cert._pending"
                  class="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200"
                >
                  {{ $t('profile.unsavedDraft') }}
                </span>
                <span
                  v-if="cert.is_active"
                  class="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200"
                >
                  {{ $t('profile.activeCertification') }}
                </span>
              </div>
              <p class="text-sm text-slate-600 mt-0.5">
                {{ cert.issuer || $t('profile.issuingOrganization') }}
              </p>
              <p class="text-xs text-slate-500 mt-1">
                {{ formatProfileDateRange(cert.issue_date, cert.expiry_date, false) }}
              </p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                class="rounded-xl px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 transition duration-200"
                @click="openCertificationForm(cert)"
              >
                {{ $t('profile.edit') }}
              </button>
              <button
                type="button"
                class="rounded-xl px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition duration-200"
                @click="deleteCertification(cert)"
              >
                {{ $t('profile.delete') }}
              </button>
            </div>
          </li>
        </ul>

        <div
          v-if="showCertificationPanel"
          class="mt-4 rounded-2xl border border-blue-100 bg-slate-50 p-4 space-y-3"
        >
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold text-slate-900">
              {{
                editingCertificationKey
                  ? $t('profile.editCertification')
                  : $t('profile.addCertification')
              }}
            </h3>
            <button
              type="button"
              class="text-slate-400 hover:text-slate-600 text-xl leading-none px-1"
              :aria-label="$t('profile.cancel')"
              @click="closeCertificationForm"
            >
              ×
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              v-model="certificationForm.name"
              type="text"
              :placeholder="$t('profile.certificationName')"
              class="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
            <input
              v-model="certificationForm.issuer"
              type="text"
              :placeholder="$t('profile.issuingOrganization')"
              class="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
            <input
              v-model="certificationForm.issue_date"
              type="date"
              class="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
            <input
              v-model="certificationForm.expiry_date"
              type="date"
              :disabled="!certificationForm.is_active"
              :placeholder="$t('profile.expiryDateOptional')"
              class="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:bg-slate-100 disabled:text-slate-400"
            />
            <input
              v-model="certificationForm.credential_id"
              type="text"
              :placeholder="$t('profile.credentialID')"
              class="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
            <input
              v-model="certificationForm.link"
              type="url"
              :placeholder="$t('profile.credentialURL')"
              class="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>
          <label class="flex items-center gap-2 text-sm text-slate-700">
            <input
              v-model="certificationForm.is_active"
              type="checkbox"
              class="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
            />
            {{ $t('profile.activeCertification') }}
          </label>
          <div class="flex flex-col-reverse sm:flex-row gap-2 pt-1">
            <button
              type="button"
              class="sm:flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 transition duration-200 min-h-11"
              @click="closeCertificationForm"
            >
              {{ $t('profile.cancel') }}
            </button>
            <button
              type="button"
              class="sm:flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition duration-200 min-h-11 disabled:opacity-50"
              :disabled="savingCertification"
              @click="saveCertification"
            >
              {{ savingCertification ? $t('profile.saving') : $t('profile.save') }}
            </button>
          </div>
        </div>

        <button
          v-if="!showCertificationPanel"
          type="button"
          class="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition duration-200 min-h-11"
          @click="openCertificationForm()"
        >
          + {{ $t('profile.addCertification') }}
        </button>
      </div>



      <!-- CV PARSER TAB -->
      <div v-else-if="activeTab === 'cvparser'" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6">
        <div class="mb-5">
          <h2 class="text-lg md:text-xl font-semibold text-slate-900">{{ $t('profile.cvParser.title') }}</h2>
          <p class="text-sm text-slate-500 mt-1">{{ $t('profile.cvParser.subtitle') }}</p>
        </div>

        <!-- Upload Section -->
        <div class="rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 p-4 md:p-6 mb-6">
          <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div class="flex-1 w-full">
              <label class="mb-1.5 block text-sm font-medium text-slate-700">
                {{ $t('profile.cvParser.uploadLabel') }}
              </label>
              <input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                ref="cvParserFileInput"
                class="w-full text-sm rounded-xl border border-slate-200 bg-white px-3 py-2.5 min-h-11 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700"
              />
              <p class="text-xs text-slate-500 mt-1.5">{{ $t('profile.cvParser.acceptedFormats') }}</p>
            </div>
            <button
              type="button"
              @click="parseCVFile"
              :disabled="cvParserLoading || cvParserRateLimited"
              class="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition duration-200 min-h-11 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {{ cvParserLoading ? $t('profile.cvParser.parsing') : $t('profile.cvParser.parseButton') }}
            </button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="cvParserLoading" class="flex items-center gap-3 py-8 justify-center text-blue-600">
          <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <span class="text-sm font-medium">{{ $t('profile.cvParser.parsing') }}</span>
        </div>

        <!-- Error -->
        <div v-else-if="cvParserError && !cvParsedData" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {{ cvParserError }}
        </div>

        <!-- Parsed Results -->
        <div v-else-if="cvParsedData" class="space-y-6">
          <div class="flex items-center gap-2 mb-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5">
            <svg class="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="text-sm font-semibold text-emerald-800">{{ $t('profile.cvParser.parseSuccess') }}</span>
          </div>

          <!-- Badge helper -->
          <!-- Personal Info Section -->
          <div class="rounded-2xl border border-slate-200 p-4">
            <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 class="text-sm font-semibold text-slate-900">{{ $t('profile.personalInfo') }}</h3>
              <button
                @click="applyParsedPersonalInfo"
                class="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition duration-200"
              >
                {{ $t('profile.cvParser.applyToProfile') }}
              </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div v-if="cvParsedData.name" class="bg-slate-50 rounded-xl px-3 py-2">
                <span class="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded mb-1">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                  {{ $t('profile.cvParser.foundInCV') }}
                </span>
                <p class="text-xs text-slate-500">{{ $t('profile.fullNameLabel') }}</p>
                <p class="text-sm font-medium text-slate-800">{{ cvParsedData.name }}</p>
              </div>
              <div v-if="cvParsedData.email" class="bg-slate-50 rounded-xl px-3 py-2">
                <span class="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded mb-1">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                  {{ $t('profile.cvParser.foundInCV') }}
                </span>
                <p class="text-xs text-slate-500">{{ $t('profile.email') }}</p>
                <p class="text-sm font-medium text-slate-800">{{ cvParsedData.email }}</p>
              </div>
              <div v-if="cvParsedData.phone || cvParsedData.telephone" class="bg-slate-50 rounded-xl px-3 py-2">
                <span class="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded mb-1">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                  {{ $t('profile.cvParser.foundInCV') }}
                </span>
                <p class="text-xs text-slate-500">{{ $t('profile.phone') }}</p>
                <p class="text-sm font-medium text-slate-800">{{ cvParsedData.phone || cvParsedData.telephone }}</p>
              </div>
              <div v-if="cvParsedData.date_of_birth" class="bg-slate-50 rounded-xl px-3 py-2">
                <span class="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded mb-1">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                  {{ $t('profile.cvParser.foundInCV') }}
                </span>
                <p class="text-xs text-slate-500">{{ $t('profile.dateOfBirth') }}</p>
                <p class="text-sm font-medium text-slate-800">{{ cvParsedData.date_of_birth }}</p>
              </div>
              <div v-if="cvParsedData.address" class="bg-slate-50 rounded-xl px-3 py-2 sm:col-span-2">
                <span class="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded mb-1">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                  {{ $t('profile.cvParser.foundInCV') }}
                </span>
                <p class="text-xs text-slate-500">{{ $t('profile.address') }}</p>
                <p class="text-sm font-medium text-slate-800">{{ cvParsedData.address }}</p>
              </div>
              <div v-if="cvParsedData.summary || cvParsedData.profile_summary" class="bg-slate-50 rounded-xl px-3 py-2 sm:col-span-2">
                <span class="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded mb-1">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                  {{ $t('profile.cvParser.foundInCV') }}
                </span>
                <p class="text-xs text-slate-500">{{ $t('profile.profileSummary') }}</p>
                <p class="text-sm text-slate-800 line-clamp-4">{{ cvParsedData.summary || cvParsedData.profile_summary }}</p>
              </div>
            </div>
          </div>

          <!-- Skills Section -->
          <div v-if="cvParsedData.skills && cvParsedData.skills.length" class="rounded-2xl border border-slate-200 p-4">
            <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 class="text-sm font-semibold text-slate-900">{{ $t('profile.skills') }}</h3>
              <span class="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                {{ $t('profile.cvParser.foundInCV') }}
              </span>
            </div>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="(skill, idx) in cvParsedData.skills"
                :key="idx"
                class="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-medium"
              >
                {{ typeof skill === 'string' ? skill : skill.name }}
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-2">{{ $t('profile.cvParser.skillsHint') }}</p>
          </div>

          <!-- Work Experience Section -->
          <div v-if="cvParsedData.work_experiences && cvParsedData.work_experiences.length" class="rounded-2xl border border-slate-200 p-4">
            <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 class="text-sm font-semibold text-slate-900">{{ $t('profile.workExperience') }}</h3>
              <button
                @click="applyAllParsedWorkExp"
                class="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition duration-200"
              >
                {{ $t('profile.cvParser.applyAll') }}
              </button>
            </div>
            <div class="space-y-3">
              <div
                v-for="(exp, idx) in cvParsedData.work_experiences"
                :key="idx"
                class="bg-slate-50 rounded-xl p-3"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <span class="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded mb-2">
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                      {{ $t('profile.cvParser.foundInCV') }}
                    </span>
                    <p class="text-sm font-semibold text-slate-900">{{ exp.job_title }}</p>
                    <p class="text-xs text-slate-600">{{ exp.company_name }}</p>
                    <p class="text-xs text-slate-400 mt-0.5">
                      {{ exp.start_date }} – {{ exp.is_current ? $t('profile.currentlyWorkingHere') : (exp.end_date || '-') }}
                    </p>
                    <p v-if="exp.description" class="text-xs text-slate-600 mt-1 line-clamp-2">{{ exp.description }}</p>
                  </div>
                  <button
                    @click="applyParsedWorkExp(exp)"
                    class="shrink-0 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition duration-200"
                  >
                    {{ $t('profile.cvParser.apply') }}
                  </button>
                </div>
              </div>
            </div>
            <p class="text-xs text-slate-400 mt-2">{{ $t('profile.cvParser.applyHint') }}</p>
          </div>

          <!-- Education Section -->
          <div v-if="cvParsedData.educations && cvParsedData.educations.length" class="rounded-2xl border border-slate-200 p-4">
            <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 class="text-sm font-semibold text-slate-900">{{ $t('education') }}</h3>
              <button
                @click="applyAllParsedEducation"
                class="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition duration-200"
              >
                {{ $t('profile.cvParser.applyAll') }}
              </button>
            </div>
            <div class="space-y-3">
              <div
                v-for="(edu, idx) in cvParsedData.educations"
                :key="idx"
                class="bg-slate-50 rounded-xl p-3"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <span class="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded mb-2">
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                      {{ $t('profile.cvParser.foundInCV') }}
                    </span>
                    <p class="text-sm font-semibold text-slate-900">{{ edu.degree }} <span v-if="edu.major">– {{ edu.major }}</span></p>
                    <p class="text-xs text-slate-600">{{ edu.institution_name }}</p>
                    <p class="text-xs text-slate-400 mt-0.5">
                      {{ edu.start_date }} – {{ edu.is_current ? $t('profile.currentlyStudyingHere') : (edu.end_date || '-') }}
                    </p>
                  </div>
                  <button
                    @click="applyParsedEducation(edu)"
                    class="shrink-0 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition duration-200"
                  >
                    {{ $t('profile.cvParser.apply') }}
                  </button>
                </div>
              </div>
            </div>
            <p class="text-xs text-slate-400 mt-2">{{ $t('profile.cvParser.applyHint') }}</p>
          </div>

          <!-- Certifications Section -->
          <div v-if="cvParsedData.certifications && cvParsedData.certifications.length" class="rounded-2xl border border-slate-200 p-4">
            <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 class="text-sm font-semibold text-slate-900">{{ $t('profile.certifications') }}</h3>
              <button
                @click="applyAllParsedCertifications"
                class="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition duration-200"
              >
                {{ $t('profile.cvParser.applyAll') }}
              </button>
            </div>
            <div class="space-y-3">
              <div
                v-for="(cert, idx) in cvParsedData.certifications"
                :key="idx"
                class="bg-slate-50 rounded-xl p-3"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <span class="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded mb-2">
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                      {{ $t('profile.cvParser.foundInCV') }}
                    </span>
                    <p class="text-sm font-semibold text-slate-900">{{ cert.name }}</p>
                    <p class="text-xs text-slate-600">{{ cert.issuer }}</p>
                    <p class="text-xs text-slate-400 mt-0.5">{{ cert.issue_date }}</p>
                  </div>
                  <button
                    @click="applyParsedCertification(cert)"
                    class="shrink-0 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition duration-200"
                  >
                    {{ $t('profile.cvParser.apply') }}
                  </button>
                </div>
              </div>
            </div>
            <p class="text-xs text-slate-400 mt-2">{{ $t('profile.cvParser.applyHint') }}</p>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'applied'" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6 space-y-4">
        <div class="mb-1">
          <h2 class="text-lg md:text-xl font-semibold text-slate-900">{{ $t('profile.appliedJobs') }}</h2>
          <p class="text-sm text-slate-500 mt-1">{{ $t('profile.appliedJobsHint') }}</p>
        </div>
        <div v-if="loadingApplied" class="text-sm text-slate-500 py-8 text-center">
          {{ $t('profile.loadingAppliedJobs') }}
        </div>
        <div v-else-if="appliedError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {{ appliedError }}
        </div>
        <div
          v-else-if="!appliedJobCards.length"
          class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500"
        >
          {{ $t('profile.noAppliedJobs') }}
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="item in appliedJobs"
            :key="item.id || item.application_id || item.job_id"
            class="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 cursor-pointer hover:border-blue-200 hover:bg-slate-50/50 transition duration-200"
            @click="goToJobDetail(item)"
          >
            <div class="flex flex-col sm:flex-row gap-3 md:gap-4">
              <div class="shrink-0 self-start">
                <img
                  :src="
                    (item.job?.avatar_url || item.avatar_url)
                      ? `${linkStorageUrl}${item.job?.avatar_url || item.avatar_url}`
                      : '/company-default-image.png'
                  "
                  @error="(e) => (e.target.src = '/company-default-image.png')"
                  :alt="item.job?.company_name || item.company_name"
                  class="w-14 h-14 md:w-16 md:h-16 rounded-xl object-cover border border-slate-100"
                />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <h3 class="text-sm md:text-base font-semibold text-slate-900 hover:text-blue-600 line-clamp-2">
                    {{
                      item.job?.title ||
                      item.job_title ||
                      item.title ||
                      $t('profile.untitledJob')
                    }}
                  </h3>
                  <span
                    class="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-md ring-1 ring-inset ring-emerald-200 whitespace-nowrap shrink-0"
                  >
                    <svg
                      class="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {{ $t('profile.applied') }}
                  </span>
                </div>
                <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-xs md:text-sm text-slate-600 mb-3">
                  <div class="flex items-center gap-1 min-w-0">
                    <svg
                      class="w-4 h-4 shrink-0 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <span class="truncate">{{
                      item.job?.company_name ||
                      item.company_name ||
                      item.company ||
                      ""
                    }}</span>
                  </div>
                  <div class="flex items-center gap-1 min-w-0">
                    <svg
                      class="w-4 h-4 shrink-0 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span class="truncate">{{ item.job?.location || item.location || "-" }}</span>
                  </div>
                </div>
                <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-xs md:text-sm mb-2">
                  <div class="flex items-center gap-1 text-emerald-700 font-semibold whitespace-nowrap">
                    <span v-if="item.job?.salary_min">{{ formatNumber(item.job?.salary_min) }} {{ item.job?.currency }}</span>
                    <span v-if="item.job?.salary_min && item.job?.salary_max">-</span>
                    <span v-if="item.job?.salary_max">{{ formatNumber(item.job?.salary_max) }} {{ item.job?.currency }}</span>
                  </div>
                  <div class="flex items-center gap-1 text-slate-500">
                    <span>{{ item.job?.employment_type || item.employment_type || "-" }}</span>
                  </div>
                  <div class="flex items-center gap-1 text-slate-500">
                    <span>{{ formatDate(item.applied_at || item.created_at) }}</span>
                  </div>
                </div>
                <p class="text-sm text-slate-600 line-clamp-2">
                  {{ item.job?.description || item.description || "-" }}
                </p>
              </div>
              <div class="flex items-center">
                <svg
                  class="w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6 space-y-4">
        <div class="mb-1">
          <h2 class="text-lg md:text-xl font-semibold text-slate-900">{{ $t('profile.savedJobs') }}</h2>
          <p class="text-sm text-slate-500 mt-1">{{ $t('profile.savedJobsHint') }}</p>
        </div>
        <div v-if="loadingSaved" class="text-sm text-slate-500 py-8 text-center">
          {{ $t('profile.loadingSavedJobs') }}
        </div>
        <div v-else-if="savedError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {{ savedError }}
        </div>
        <div
          v-else-if="!savedJobCards.length"
          class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500"
        >
          {{ $t('profile.noSavedJobs') }}
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="job in savedJobCards"
            :key="job.job_post_id"
            class="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 cursor-pointer group hover:border-blue-200 hover:bg-slate-50/50 transition duration-200"
            @click="goToJobDetail(job)"
          >
            <div class="flex flex-col sm:flex-row gap-3 md:gap-4">
              <div class="shrink-0 self-start">
                <img
                  :src="
                    job.recruiter_avatar_url
                      ? `${linkStorageUrl}${job.recruiter_avatar_url}`
                      : '/company-default-image.png'
                  "
                  @error="(e) => (e.target.src = '/company-default-image.png')"
                  :alt="job.company_name"
                  class="w-14 h-14 md:w-16 md:h-16 rounded-xl object-cover border border-slate-100"
                />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <h3 class="text-sm md:text-base font-semibold text-slate-900 hover:text-blue-600 line-clamp-2">
                    {{ job.title || $t('profile.untitledJob') }}
                  </h3>
                  <span
                    class="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 text-xs font-medium rounded-md ring-1 ring-inset ring-amber-200 whitespace-nowrap shrink-0"
                  >
                    <svg
                      class="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      />
                    </svg>
                    {{ $t('profile.saved') }}
                  </span>
                </div>
                <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-xs md:text-sm text-slate-600 mb-2">
                  <div class="flex items-center gap-1 min-w-0">
                    <svg
                      class="w-4 h-4 shrink-0 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <span class="truncate">{{ job.company_name || job.company || "-" }}</span>
                  </div>
                  <div class="flex items-center gap-1 min-w-0">
                    <svg
                      class="w-4 h-4 shrink-0 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span class="truncate">{{ job.location || "-" }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-4 text-sm mb-3">
                  <div class="flex items-center gap-1 text-emerald-700 font-semibold">
                    <span v-if="job.salary_min">{{ formatNumber(job.salary_min) }} {{ job.currency }}</span>
                    <span v-if="job.salary_min && job.salary_max">-</span>
                    <span v-if="job.salary_max">{{ formatNumber(job.salary_max) }} {{ job.currency }}</span>
                  </div>
                  <div class="flex items-center gap-1 text-slate-500">
                    <span>{{ job.employment_type || "-" }}</span>
                  </div>
                </div>
                <p class="text-sm text-slate-600 line-clamp-2">
                  {{ stripHtml(job.description) || "-" }}
                </p>
              </div>
              <div class="flex items-center">
                <button
                  type="button"
                  @click.stop="handleRemoveSaved(job)"
                  class="rounded-xl p-2 text-red-600 hover:bg-red-50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition duration-200"
                  :title="$t('profile.removeFromSaved')"
                >
                  <svg
                    class="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M6.707 6.707a1 1 0 0 0 0 1.414L10.586 12l-3.879 3.879a1 1 0 1 0 1.414 1.414L12 13.414l3.879 3.879a1 1 0 0 0 1.414-1.414L13.414 12l3.879-3.879a1 1 0 0 0-1.414-1.414L12 10.586 8.121 6.707a1 1 0 0 0-1.414 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
