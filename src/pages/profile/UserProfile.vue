<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import api from "@/services/api";
import { getSavedJobs, removeSavedJob } from "@/services/saved-jobs.api";
import { useAuthStore } from "@/stores/authStore.js";
import SearchableSelect from "@/components/common/SearchableSelect.vue";

const router = useRouter();
const auth = useAuthStore();
const { t } = useI18n();

const activeTab = ref(localStorage.getItem("profileActiveTab") || "profile");
const loadingProfile = ref(false);
const savingProfile = ref(false);
const loadingApplied = ref(false);
const loadingSaved = ref(false);
const appliedError = ref("");
const savedError = ref("");

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

const appliedJobs = ref([]);
const savedJobs = ref([]);

const showSkillModal = ref(false);
const skillSearchQuery = ref("");
const skillSuggestions = ref([]);
const loadingSkills = ref(false);

const languages = ref([]);
const showLanguageModal = ref(false);
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

// Seeded ids in proficiency_levels (backend returns only the name on profile load)
const PROFICIENCY_NAME_TO_ID = { Beginner: 1, Intermediate: 2, Fluent: 3, Native: 4 };
const proficiencyOptions = computed(() => [
  { id: 1, label: t("profile.proficiency.beginner") },
  { id: 2, label: t("profile.proficiency.intermediate") },
  { id: 3, label: t("profile.proficiency.fluent") },
  { id: 4, label: t("profile.proficiency.native") },
]);

function proficiencyLabel(id) {
  return proficiencyOptions.value.find((p) => p.id === Number(id))?.label || "";
}

// CV Parser
const cvParserFileInput = ref(null);
const cvParserLoading = ref(false);
const cvParsedData = ref(null);
const cvParserError = ref("");

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
    form.email = data.email ?? "";
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
    languages.value = (data.languages ?? []).map((l) => ({
      ...l,
      // Profile endpoint returns the proficiency name (as `name`) but not its id
      proficiency_level_id:
        l.proficiency_level_id ?? PROFICIENCY_NAME_TO_ID[l.proficiency_level_name || l.name] ?? "",
    }));
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
     push.error(err?.response?.data?.message || t('profile.failedToUpdateProfile'));
  } finally {
    savingProfile.value = false;
  }
}

// Resume management
async function addResume(file, title, isDefault) {
  try {
    if (!/application\/pdf/i.test(file.type)) {
        push.error(t('profile.onlyPDFAllowed'));
      return;
    }

    if (file.size > CV_MAX_MB * 1024 * 1024) {
        push.error(t('profile.maxSizeMB', { size: CV_MAX_MB }));
      return;
    }

    if (!title.trim()) {
        push.error(t('profile.titleRequired'));
      return;
    }

    if (resumes.value.length >= RESUME_LIMIT) {
        push.error(t('profile.maxResumes', { limit: RESUME_LIMIT }));
      return;
    }

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

       push.success(t('profile.resumeAddedSuccessfully'));
  } catch (err) {
       push.error(t('profile.failedToUploadResume'));
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

       push.success(t('profile.resumeRemoved'));
  } catch (err) {
       push.error(t('profile.failedToDeleteResume'));
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

       push.success(t('profile.resumeSetAsPrimary'));
  } catch (err) {
       push.error(t('profile.failedToSetPrimaryResume'));
  }
}

// Work Experience
async function addWorkExp() {
  try {
    const res = await api.post(
      "/workers/work-exp",
      {
        company_name: "Company Name",
        job_title: "Job Title",
        start_date: new Date().toISOString().split("T")[0],
        end_date: null,
        is_current: false,
        description: null,
      },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      },
    );

    workExperiences.value.unshift(res.data.data);
  } catch (err) {
     push.error(t('profile.failedToAddWorkExperience'));
  }
}

async function saveWorkExp(item) {
  try {
    if (item.is_current) item.end_date = null;
    if (!item.id) {
      const res = await api.post("/workers/work-exp", item, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      item.id = res.data.data.id;
      delete item._pending;
    } else {
      await api.put(`/workers/work-exp/${item.id}`, item, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
    }
     push.success(t('profile.workExperienceAdded'));
  } catch (err) {
     push.error(t('profile.failedToUpdateWorkExperience'));
  }
}

async function deleteWorkExp(id) {
  if (!id) {
    workExperiences.value = workExperiences.value.filter((w) => w.id !== id && !(w._pending && !w.id));
    return;
  }
  try {
    await api.delete(`/workers/work-exp/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    workExperiences.value = workExperiences.value.filter((w) => w.id !== id);
     push.success(t('profile.workExperienceRemoved'));
  } catch (err) {
     push.error(t('profile.failedToDeleteWorkExperience'));
  }
}

// Education
async function addEducation() {
  try {
    const res = await api.post(
      "/workers/educations",
      {
        institution_name: "Institution",
        degree: "Degree",
        major: "Major",
        start_date: new Date().toISOString().split("T")[0],
        end_date: null,
        is_current: false,
        description: "",
      },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      },
    );

    educations.value.unshift(res.data.data);
  } catch (err) {
     push.error(t('profile.failedToAddEducation'));
  }
}

async function saveEducation(item) {
  try {
    if (item.is_current) item.end_date = null;
    if (!item.id) {
      const res = await api.post("/workers/educations", item, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      item.id = res.data.data.id;
      delete item._pending;
    } else {
      await api.put(`/workers/educations/${item.id}`, item, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
    }
     push.success(t('profile.educationAdded'));
  } catch (err) {
     push.error(t('profile.failedToUpdateEducation'));
  }
}

async function deleteEducation(id) {
  if (!id) {
    educations.value = educations.value.filter((e) => e.id !== id && !(e._pending && !e.id));
    return;
  }
  try {
    await api.delete(`/workers/educations/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    educations.value = educations.value.filter((e) => e.id !== id);
     push.success(t('profile.educationRemoved'));
  } catch (err) {
     push.error(t('profile.failedToDeleteEducation'));
  }
}

// Certifications
async function addCertification() {
  try {
    const res = await api.post(
      "/workers/cert",
      {
        name: "Certification Name",
        issuer: "Issuing Organization",
        issue_date: new Date().toISOString().split("T")[0],
        expiry_date: null,
        credential_id: "",
        link: "example.com",
        is_active: true,
      },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      },
    );

    const newCert = res.data.data;
    certifications.value.unshift({
      ...newCert,
      issue_date: formatDateForInput(newCert.issue_date),
      expiry_date: formatDateForInput(newCert.expiry_date),
    //   isSaved: true,
    });
  } catch (err) {
     push.error(t('profile.failedToAddCertification'));
  }
}

async function saveCertification(item) {
  try {
    item.isSaved = true;
    if (item.is_active === false) item.expiry_date = null;
    if (!item.id) {
      const res = await api.post("/workers/cert", item, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      item.id = res.data.data.id;
      delete item._pending;
    } else {
      await api.put(`/workers/cert/${item.id}`, item, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
    }
    push.success(t('profile.certificationAdded'));
  } catch (err) {
    push.error(t('profile.failedToUpdateCertification'));
  } finally {
    item.isSaved = false;
  }
}

async function deleteCertification(id) {
  if (!id) {
    certifications.value = certifications.value.filter((c) => c.id !== id && !(c._pending && !c.id));
    return;
  }
  try {
    await api.delete(`/workers/cert/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    certifications.value = certifications.value.filter((c) => c.id !== id);
     push.success(t('profile.certificationRemoved'));
  } catch (err) {
     push.error(t('profile.failedToDeleteCertification'));
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
    const res = await api.get(`/languages?search=${encodeURIComponent(search)}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    languageSuggestions.value = res.data?.data || [];
  } catch (err) {
    // Master languages endpoint may not be deployed yet; free-text input still works
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

function openLanguageModal(language = null) {
  editingLanguageId.value = language?.id || null;
  languageForm.language_id = language?.language_id ?? null;
  languageForm.language_name = language?.language_name || "";
  languageForm.proficiency_level_id = language?.proficiency_level_id || "";
  languageForm.is_primary = Boolean(language?.is_primary);
  languageSuggestions.value = [];
  showLanguageModal.value = true;
}

function closeLanguageModal() {
  showLanguageModal.value = false;
  editingLanguageId.value = null;
  languageSuggestions.value = [];
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
      await api.put(`/workers/languages/${editingLanguageId.value}`, payload, { headers });
      const idx = languages.value.findIndex((l) => l.id === editingLanguageId.value);
      if (idx !== -1) {
        languages.value[idx] = { ...languages.value[idx], ...payload };
      }
      push.success(t("profile.languageUpdated"));
    } else {
      const res = await api.post("/workers/languages", payload, { headers });
      languages.value.push({ id: res.data?.data?.id, ...payload });
      push.success(t("profile.languageAdded"));
    }
    closeLanguageModal();
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
    const data = res?.data || res || [];
    savedJobs.value = Array.isArray(data) ? data : [];
  } catch (err) {
    savedError.value =
      err?.response?.data?.message || "Failed to load saved jobs";
    savedJobs.value = [];
  } finally {
    loadingSaved.value = false;
  }
}

async function handleRemoveSaved(job) {
  const jobId = job?.id || job?.job_id || job?.job_post_id;
  if (!jobId) return;

  try {
    await removeSavedJob(jobId);
    savedJobs.value = savedJobs.value.filter((item) => {
      const itemJob = item?.job || item?.job_post || item;
      const itemId = itemJob?.id || itemJob?.job_id || itemJob?.job_post_id;
      return itemId !== jobId;
    });
       push.success(t('profile.removedFromSavedJobs'));
  } catch (err) {
       push.error(err?.response?.data?.message || t('profile.failedToRemoveSavedJob'));
  }
}

const resumeFileInput = ref(null);
const resumeTitleInput = ref(null);
const resumeDefaultInput = ref(null);

function handleAddResume() {
  const file = resumeFileInput.value?.files?.[0];
  const title = resumeTitleInput.value?.value || "";
  const isDefault = resumeDefaultInput.value?.checked || false;

  if (!file) {
    push.error(t("notifications.pleaseSelectFile"));
    return;
  }

  addResume(file, title, isDefault);

  // Reset form
  if (resumeFileInput.value) resumeFileInput.value.value = "";
  if (resumeTitleInput.value) resumeTitleInput.value.value = "";
  if (resumeDefaultInput.value) resumeDefaultInput.value.checked = false;
}

// CV Parser functions
async function parseCVFile() {
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
    company_name: exp.company_name || '',
    job_title: exp.job_title || '',
    start_date: formatDateForInput(exp.start_date),
    end_date: exp.is_current ? null : formatDateForInput(exp.end_date),
    is_current: exp.is_current || false,
    description: exp.description || '',
    _pending: true,
  });
  activeTab.value = 'work';
  push.success(t('profile.cvParser.appliedSection'));
}

function applyAllParsedWorkExp() {
  const exps = cvParsedData.value?.work_experiences || [];
  if (!exps.length) return;
  exps.forEach((exp) => {
    workExperiences.value.unshift({
      company_name: exp.company_name || '',
      job_title: exp.job_title || '',
      start_date: formatDateForInput(exp.start_date),
      end_date: exp.is_current ? null : formatDateForInput(exp.end_date),
      is_current: exp.is_current || false,
      description: exp.description || '',
      _pending: true,
    });
  });
  activeTab.value = 'work';
  push.success(t('profile.cvParser.appliedSection'));
}

function applyParsedEducation(edu) {
  educations.value.unshift({
    institution_name: edu.institution_name || '',
    degree: edu.degree || '',
    major: edu.major || '',
    start_date: formatDateForInput(edu.start_date),
    end_date: edu.is_current ? null : formatDateForInput(edu.end_date),
    is_current: edu.is_current || false,
    description: edu.description || '',
    _pending: true,
  });
  activeTab.value = 'education';
  push.success(t('profile.cvParser.appliedSection'));
}

function applyAllParsedEducation() {
  const edus = cvParsedData.value?.educations || [];
  if (!edus.length) return;
  edus.forEach((edu) => {
    educations.value.unshift({
      institution_name: edu.institution_name || '',
      degree: edu.degree || '',
      major: edu.major || '',
      start_date: formatDateForInput(edu.start_date),
      end_date: edu.is_current ? null : formatDateForInput(edu.end_date),
      is_current: edu.is_current || false,
      description: edu.description || '',
      _pending: true,
    });
  });
  activeTab.value = 'education';
  push.success(t('profile.cvParser.appliedSection'));
}

function applyParsedCertification(cert) {
  certifications.value.unshift({
    name: cert.name || '',
    issuer: cert.issuer || '',
    issue_date: formatDateForInput(cert.issue_date),
    expiry_date: formatDateForInput(cert.expiry_date),
    credential_id: cert.credential_id || '',
    link: cert.link || '',
    is_active: true,
    _pending: true,
  });
  activeTab.value = 'certifications';
  push.success(t('profile.cvParser.appliedSection'));
}

function applyAllParsedCertifications() {
  const certs = cvParsedData.value?.certifications || [];
  if (!certs.length) return;
  certs.forEach((cert) => {
    certifications.value.unshift({
      name: cert.name || '',
      issuer: cert.issuer || '',
      issue_date: formatDateForInput(cert.issue_date),
      expiry_date: formatDateForInput(cert.expiry_date),
      credential_id: cert.credential_id || '',
      link: cert.link || '',
      is_active: true,
      _pending: true,
    });
  });
  activeTab.value = 'certifications';
  push.success(t('profile.cvParser.appliedSection'));
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
  <div class="bg-gray-50 min-h-screen py-6 md:py-10">
    <div class="max-w-6xl mx-auto px-3 md:px-4 sm:max-w-md md:max-w-2xl lg:max-w-4xl">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-xl md:text-2xl font-semibold text-gray-900">{{ $t('profile.myProfile') }}</h1>
          <p class="text-xs md:text-sm text-gray-500">
            {{ $t('profile.manageProfile') }}
          </p>
        </div>
        <RouterLink
          to="/change-password"
          class="rounded-full font-semibold bg-gray-900 text-white px-4 py-2 text-sm hover:bg-gray-800 transition text-center md:text-left"
        >
          {{ $t('profile.changePassword') }}
        </RouterLink>
      </div>

      <div
        class="bg-white w-full rounded-lg md:rounded-2xl shadow-sm p-1 md:p-2 flex gap-1 md:gap-2 mb-6 md:mb-8 overflow-x-auto flex-nowrap justify-around"
      >
        <button
          class="px-2 md:px-4 py-2 text-xs md:text-sm rounded-lg md:rounded-xl whitespace-nowrap min-h-10 transition-colors w-full"
          :class="
            activeTab === 'profile'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          "
          @click="activeTab = 'profile'"
        >
          <span class="hidden sm:inline">{{ $t('profile.personalInfo') }}</span>
          <span class="sm:hidden">{{ $t('profile.profilePhoto') }}</span>
        </button>
        <button
          class="px-2 md:px-4 py-2 text-xs md:text-sm rounded-lg md:rounded-xl whitespace-nowrap min-h-10 transition-colors w-full"
          :class="
            activeTab === 'resumes'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          "
          @click="activeTab = 'resumes'"
        >
          {{ $t('resume') }}
        </button>
        <button
          class="px-2 md:px-4 py-2 text-xs md:text-sm rounded-lg md:rounded-xl whitespace-nowrap min-h-10 transition-colors w-full"
          :class="
            activeTab === 'work'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          "
          @click="activeTab = 'work'"
        >
          <span class="hidden sm:inline">{{ $t('profile.workExperience') }}</span>
          <span class="sm:hidden">{{ $t('profile.work') }}</span>
        </button>
        <button
          class="px-2 md:px-4 py-2 text-xs md:text-sm rounded-lg md:rounded-xl whitespace-nowrap min-h-10 transition-colors w-full"
          :class="
            activeTab === 'education'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          "
          @click="activeTab = 'education'"
        >
          <span class="hidden sm:inline">{{ $t('education') }}</span>
          <span class="sm:hidden">{{ $t('profile.edu') }}</span>
        </button>
        <button
          class="px-2 md:px-4 py-2 text-xs md:text-sm rounded-lg md:rounded-xl whitespace-nowrap min-h-10 transition-colors w-full"
          :class="
            activeTab === 'certifications'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          "
          @click="activeTab = 'certifications'"
        >
          <span class="hidden sm:inline">{{ $t('profile.certifications') }}</span>
          <span class="sm:hidden">{{ $t('profile.cert') }}</span>
        </button>
        <button
          class="px-2 md:px-4 py-2 text-xs md:text-sm rounded-lg md:rounded-xl whitespace-nowrap min-h-10 transition-colors w-full"
          :class="
            activeTab === 'cvparser'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          "
          @click="activeTab = 'cvparser'"
        >
          <span class="hidden sm:inline">{{ $t('profile.cvParser.tab') }}</span>
          <span class="sm:hidden">CV</span>
        </button>
        <button
          class="px-2 md:px-4 py-2 text-xs md:text-sm rounded-lg md:rounded-xl whitespace-nowrap min-h-10 transition-colors w-full"
          :class="
            activeTab === 'applied'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          "
          @click="activeTab = 'applied'"
        >
          <span class="hidden sm:inline">{{ $t('profile.appliedJobs') }}</span>
          <span class="sm:hidden">{{ $t('profile.applied') }}</span>
        </button>
        <button
          class="px-2 md:px-4 py-2 text-xs md:text-sm rounded-lg md:rounded-xl whitespace-nowrap min-h-10 transition-colors w-full"
          :class="
            activeTab === 'saved'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          "
          @click="activeTab = 'saved'"
        >
          <span class="hidden sm:inline">{{ $t('profile.savedJobs') }}</span>
          <span class="sm:hidden">{{ $t('saved') }}</span>
        </button>
      </div>

      <!-- PERSONAL INFO TAB -->
      <div
        v-if="activeTab === 'profile'"
        class="bg-white rounded-2xl shadow-sm p-6"
      >
        <div v-if="loadingProfile" class="text-sm text-gray-500">
          {{ $t('profile.loadingProfile') }}
        </div>

        <form v-else class="space-y-6" @submit.prevent="saveProfile">
          <!-- Avatar Section -->
          <div class="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6 pb-6 border-b">
            <div class="relative shrink-0">
              <div
                class="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100"
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
                  class="h-full w-full flex items-center justify-center bg-blue-100 text-blue-600 text-xl sm:text-2xl md:text-3xl font-bold"
                >
                  {{ form.name?.charAt(0)?.toUpperCase() || "?" }}
                </div>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <label class="block text-xs md:text-sm font-medium mb-2"
                >{{ $t('profile.profilePhoto') }}</label
              >
              <input
                type="file"
                accept="image/*"
                @change="onAvatarChange"
                class="text-xs md:text-sm w-full rounded-lg border border-gray-200 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-10"
              />
              <p class="text-xs text-gray-500 mt-1">{{ $t('profile.jpgOrPngMax2MB') }}</p>
            </div>
          </div>

          <!-- Basic Info -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="text-xs md:text-sm font-medium text-gray-700"
                >{{ $t('profile.fullNameLabel') }} <span class="text-red-500">*</span></label
              >
              <input
                v-model="form.name"
                type="text"
                class="w-full rounded-lg border border-gray-200 shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-10"
                :placeholder="$t('profile.yourNamePlaceholder')"
                required
              />
            </div>

            <div>
              <label class="text-xs md:text-sm font-medium text-gray-700">{{ $t('profile.email') }} <span class="text-red-500">*</span></label>
              <input
                v-model="form.email"
                type="email"
                class="w-full rounded-lg border border-gray-200 shadow-sm px-3 py-2 text-sm bg-gray-50 min-h-10"
                :placeholder="$t('profile.email')"
                readonly
              />
            </div>

            <div>
              <label class="text-xs md:text-sm font-medium text-gray-700">{{ $t('profile.phone') }} <span class="text-red-500">*</span></label>
              <input
                v-model="form.telephone"
                type="text"
                class="w-full rounded-lg border border-gray-200 shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-10"
                :placeholder="$t('profile.phone')"
              />
            </div>

            <div>
              <label class="text-xs md:text-sm font-medium text-gray-700"
                >{{ $t('profile.dateOfBirth') }} <span class="text-red-500">*</span></label
              >
              <input
                v-model="form.date_of_birth"
                type="date"
                class="w-full rounded-lg border border-gray-200 shadow-sm px-3 py-2 md:py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-10"
              />
            </div>

            <div>
              <label class="text-xs md:text-sm font-medium text-gray-700">{{ $t('profile.gender') }} <span class="text-red-500">*</span></label>
              <select
                v-model="form.gender_id"
                class="w-full rounded-lg border border-gray-200 shadow-sm px-3 py-2 md:py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-10"
              >
                <option value="">{{ $t('profile.selectGender') }}</option>
                <option v-for="g in genders" :key="g.id" :value="g.id">
                  {{ g.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="text-xs md:text-sm font-medium text-gray-700"
                >{{ $t('profile.nationality') }}</label
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
              <label class="text-xs md:text-sm font-medium text-gray-700">{{ $t('profile.religion') }}</label>
              <select
                v-model="form.religion_id"
                class="w-full rounded-lg border border-gray-200 shadow-sm px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-10"
              >
                <option value="">{{ $t('profile.selectReligion') }}</option>
                <option v-for="r in religions" :key="r.id" :value="r.id">
                  {{ r.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="text-xs md:text-sm font-medium text-gray-700"
                >{{ $t('profile.maritalStatus') }}</label
              >
              <select
                v-model="form.marriage_status_id"
                class="w-full rounded-lg border border-gray-200 shadow-sm px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-10"
              >
                <option value="">{{ $t('profile.selectStatus') }}</option>
                <option v-for="m in maritalStatuses" :key="m.id" :value="m.id">
                  {{ m.status }}
                </option>
              </select>
            </div>

            <div class="col-span-2">
              <label class="text-xs md:text-sm font-medium text-gray-700"
                >{{ $t('profile.currentSalary') }}</label
              >
              <div class="grid grid-cols-2 gap-2">
                <input
                  v-model="form.current_salary"
                  type="number"
                  class="w-full rounded-lg border border-gray-200 shadow-sm px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-10"
                  :placeholder="$t('profile.salaryExample')"
                />
                <div class="relative currency-dropdown-current">
                  <input
                    v-model="currentCurrencyInput"
                    type="text"
                    class="w-full rounded-lg border border-gray-200 shadow-sm px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-10 cursor-pointer"
                    :placeholder="$t('profile.selectCurrency') || 'Select Currency'"
                    @click="toggleCurrentCurrencyDropdown"
                  />
                  <div
                    v-if="showCurrentCurrencyDropdown && currencyOptions.length"
                    class="absolute z-10 bg-white shadow-lg w-full mt-1 max-h-48 overflow-y-auto border border-gray-200 rounded-md"
                  >
                    <div
                      v-for="currency in currencyOptions"
                      :key="currency.id"
                      @click="selectCurrentCurrency(currency)"
                      class="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
                        >
                        {{ currency.name }} ({{ currency.code }})
                    </div>
                  </div>
                  <p v-if="currencyLoading" class="text-xs text-gray-500 mt-1">
                    {{ $t('profile.loadingCurrencies') || 'Loading...' }}
                  </p>
                </div>
              </div>
            </div>

            <div class="col-span-2">
              <label class="text-xs md:text-sm font-medium text-gray-700"
                >{{ $t('profile.expectedSalary') }}</label
              >
              <div class="grid grid-cols-2 gap-2">
                <input
                  v-model="form.expected_salary"
                  type="number"
                  class="w-full rounded-lg border border-gray-200 shadow-sm px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-10"
                  :placeholder="$t('profile.salaryExample')"
                />
                <div class="relative currency-dropdown-expected">
                  <input
                    v-model="expectedCurrencyInput"
                    type="text"
                    class="w-full rounded-lg border border-gray-200 shadow-sm px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-10 cursor-pointer"
                    :placeholder="$t('profile.selectCurrency') || 'Select Currency'"
                    @click="toggleExpectedCurrencyDropdown"
                  />
                  <div
                    v-if="showExpectedCurrencyDropdown && currencyOptions.length"
                    class="absolute z-10 bg-white shadow-lg w-full mt-1 max-h-48 overflow-y-auto border border-gray-200 rounded-md"
                  >
                    <div
                      v-for="currency in currencyOptions"
                      :key="currency.id"
                      @click="selectExpectedCurrency(currency)"
                      class="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
                    >
                      {{ currency.name }} ({{ currency.code }})
                    </div>
                  </div>
                  <p v-if="currencyLoading" class="text-xs text-gray-500 mt-1">
                    {{ $t('profile.loadingCurrencies') || 'Loading...' }}
                  </p>
                </div>
              </div>
            </div>

            <div class="col-span-2">
              <label class="text-xs md:text-sm font-medium text-gray-700">{{ $t('profile.address') }} <span class="text-red-500">*</span></label>
              <textarea
                v-model="form.address"
                rows="2"
                class="w-full rounded-lg border border-gray-200 shadow-sm px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-10"
                :placeholder="$t('profile.yourAddress')"
              />
            </div>

            <div class="col-span-2">
              <label class="text-xs md:text-sm font-medium text-gray-700"
                >{{ $t('profile.profileSummary') }}</label
              >
              <textarea
                v-model="form.profile_summary"
                rows="4"
                class="w-full rounded-lg border border-gray-200 shadow-sm px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-10"
                :placeholder="$t('profile.profileSummaryPlaceholder')"
              />
            </div>
          </div>

          <!-- Skills Section -->
          <div class="border-t pt-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ $t('profile.skills') }}
              <span class="ml-2 text-xs text-gray-400">Optional</span>
            </label>

            <!-- SELECTED SKILLS -->
            <div
              v-if="skills.length === 0"
              class="text-xs md:text-sm text-gray-500 py-2"
            >
              {{ $t('profile.noSkillsAdded') }}
            </div>
            <div v-else class="flex gap-2 flex-wrap mt-2">
              <span
                v-for="skill in skills"
                :key="skill.id || skill.skill_id"
                @click="deleteSkill(skill)"
                class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm cursor-pointer hover:bg-green-200"
              >
                {{ skill.skill_name || skill.name }} ×
              </span>
            </div>

            <!-- ADD SKILLS BUTTON -->
            <button
              type="button"
              @click="openSkillModal"
              class="mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
            >
              + {{ $t('profile.addSkillsButton') }}
            </button>
          </div>

          <!-- Languages Section -->
          <div class="border-t pt-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ $t('profile.languages') }}
              <span class="ml-2 text-xs text-gray-400">Optional</span>
            </label>

            <div
              v-if="languages.length === 0"
              class="text-xs md:text-sm text-gray-500 py-2"
            >
              {{ $t('profile.noLanguagesAdded') }}
            </div>
            <div v-else class="space-y-2 mt-2">
              <div
                v-for="language in languages"
                :key="language.id"
                class="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
              >
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-sm font-medium text-gray-800">
                    {{ language.language_name }}
                  </span>
                  <span class="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                    {{ proficiencyLabel(language.proficiency_level_id) }}
                  </span>
                  <span
                    v-if="language.is_primary"
                    class="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs"
                  >
                    {{ $t('profile.primaryLanguage') }}
                  </span>
                </div>
                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    @click="openLanguageModal(language)"
                    class="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    {{ $t('profile.edit') }}
                  </button>
                  <button
                    type="button"
                    @click="deleteLanguage(language)"
                    class="text-red-600 hover:text-red-800 text-sm"
                  >
                    {{ $t('profile.remove') }}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              @click="openLanguageModal()"
              class="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
            >
              + {{ $t('profile.addLanguageButton') }}
            </button>
          </div>

          <div class="flex justify-end gap-2 pt-4 border-t flex-col-reverse sm:flex-row">
            <button
              type="submit"
              class="rounded-lg md:rounded-xl bg-blue-600 px-4 md:px-6 py-2.5 text-xs md:text-sm font-semibold text-white hover:bg-blue-700 transition min-h-10"
              :disabled="savingProfile"
            >
              {{ savingProfile ? $t('profile.saving') : $t('profile.saveChanges') }}
            </button>
          </div>
        </form>
      </div>

      <!-- RESUMES TAB -->
      <div
        v-else-if="activeTab === 'resumes'"
        class="bg-white rounded-lg md:rounded-2xl shadow-sm p-4 md:p-6"
      >
        <h2 class="text-base md:text-lg font-semibold mb-4">{{ $t('profile.manageResumes') }}</h2>

        <!-- Resume Counter -->
        <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p class="text-xs md:text-sm text-blue-800">
            {{ $t('profile.resumesCount', { current: resumes.length, limit: RESUME_LIMIT }) || `Resumes: ${resumes.length}/${RESUME_LIMIT}` }}
          </p>
        </div>

        <!-- Upload Resume Form -->
        <div
          class="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 rounded-lg md:rounded-xl border p-3 md:p-4 mb-6"
          :class="{ 'opacity-50 pointer-events-none': resumes.length >= RESUME_LIMIT }"
        >
          <div>
            <label class="mb-1 block text-xs md:text-sm font-medium"
              >{{ $t('profile.uploadPDF') }} <span class="text-red-500">*</span></label
            >
            <input
              type="file"
              accept="application/pdf"
              ref="resumeFileInput"
              class="w-full text-xs md:text-sm rounded-lg border px-3 py-2 min-h-10"
              :disabled="resumes.length >= RESUME_LIMIT"
            />
            <span class="text-[10px] md:text-xs text-gray-500">{{ $t('profile.maxSize5MB') }}</span>
          </div>

          <div>
            <label class="mb-1 block text-xs md:text-sm font-medium"
              >{{ $t('profile.title') }} <span class="text-red-500">*</span></label
            >
            <input
              type="text"
              ref="resumeTitleInput"
              class="w-full rounded-lg border px-3 py-2 text-xs md:text-sm min-h-10"
              :placeholder="$t('profile.professionalResume')"
              :disabled="resumes.length >= RESUME_LIMIT"
            />
          </div>

          <div class="flex flex-col justify-end gap-2">
            <label class="flex items-center gap-2 text-xs md:text-sm font-medium">
              <input type="checkbox" ref="resumeDefaultInput" class="rounded" :disabled="resumes.length >= RESUME_LIMIT" />
              <span class="hidden sm:inline">{{ $t('profile.setAsDefault') }}</span>
              <span class="sm:hidden">{{ $t('profile.default') }}</span>
            </label>
            <button
              @click="handleAddResume"
              :disabled="resumes.length >= RESUME_LIMIT"
              class="w-full rounded-lg md:rounded-xl bg-blue-600 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold text-white hover:bg-blue-700 min-h-10 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
            >
              {{ resumes.length >= RESUME_LIMIT ? $t('profile.maxResumesReached', { limit: RESUME_LIMIT }) : $t('profile.addResume') }}
            </button>
          </div>
        </div>

        <!-- Resume List -->
        <div
          v-if="resumes.length === 0"
          class="text-sm text-gray-500 text-center py-8"
        >
          {{ $t('profile.noResumesUploaded') }}
        </div>
        <div v-else class="space-y-2 md:space-y-3">
          <div
            v-for="resume in resumes"
            :key="resume.id"
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-4 p-3 md:p-4 border rounded-lg"
          >
            <div class="flex-1 min-w-0">
              <h3 class="font-medium text-sm truncate">{{ resume.title }}</h3>
              <p class="text-xs text-gray-500">
                {{ resume.created_at ? formatDate(resume.created_at) : "" }}
                <span
                  v-if="resume.is_default"
                  class="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px]"
                >
                  {{ $t('profile.primaryButton') }}
                </span>
              </p>
            </div>
            <div class="flex gap-2 flex-wrap sm:flex-nowrap">
              <a
                :href="`${linkStorageUrl}${resume.resume_url}`"
                target="_blank"
                class="text-xs md:text-sm text-blue-600 hover:underline flex-1 sm:flex-none text-center sm:text-left"
              >
                {{ $t('profile.view') }}
              </a>
              <button
                v-if="!resume.is_default"
                @click="setPrimaryResume(resume.id)"
                class="text-xs md:text-sm text-green-600 hover:underline flex-1 sm:flex-none text-center sm:text-left"
              >
                {{ $t('profile.primaryButton') }}
              </button>
              <button
                @click="removeResume(resume.id)"
                class="text-xs md:text-sm text-red-600 hover:underline flex-1 sm:flex-none text-center sm:text-left"
              >
                {{ $t('profile.remove') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- WORK EXPERIENCE TAB -->
      <div v-else-if="activeTab === 'work'" class="bg-white rounded-lg md:rounded-2xl shadow-sm p-4 md:p-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 class="text-base md:text-lg font-semibold">{{ $t('profile.workExperience') }}</h2>
          <button
            @click="addWorkExp"
            class="px-3 md:px-4 py-2 text-xs md:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-h-10 whitespace-nowrap"
          >
            + {{ $t('profile.addExperience') }}
          </button>
        </div>

        <div
          v-if="workExperiences.length === 0"
          class="text-sm text-gray-500 text-center py-8"
        >
          {{ $t('profile.noWorkExperienceAdded') }}
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="(work, idx) in workExperiences"
            :key="work.id"
            class="border rounded-lg p-4"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <input
                v-model="work.company_name"
                :placeholder="$t('profile.companyName')"
                class="rounded-lg border px-3 py-2 text-xs md:text-sm min-h-10"
              />
              <input
                v-model="work.job_title"
                :placeholder="$t('profile.jobTitle')"
                class="rounded-lg border px-3 py-2 text-xs md:text-sm min-h-10"
              />
              <input
                v-model="work.start_date"
                type="date"
                class="rounded-lg border px-3 py-2 text-xs md:text-sm min-h-10"
              />
              <input
                v-model="work.end_date"
                type="date"
                :disabled="work.is_current"
                class="rounded-lg border px-3 py-2 text-xs md:text-sm min-h-10"
              />
            </div>
            <label class="flex items-center gap-2 text-xs md:text-sm mb-3">
              <input
                type="checkbox"
                v-model="work.is_current"
                class="rounded"
              />
              {{ $t('profile.currentlyWorkingHere') }}
            </label>
            <textarea
              v-model="work.description"
              :placeholder="$t('profile.descriptionPlaceholder')"
              rows="3"
              class="w-full rounded-lg border px-3 py-2 text-xs md:text-sm mb-3 min-h-10"
            />
            <div class="flex flex-col sm:flex-row gap-2">
              <button
                @click="saveWorkExp(work)"
                class="px-3 md:px-4 py-2 text-xs md:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-h-10 flex-1 sm:flex-none"
              >
                {{ $t('profile.save') }}
              </button>
              <button
                @click="deleteWorkExp(work.id)"
                class="px-3 md:px-4 py-2 text-xs md:text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 min-h-10 flex-1 sm:flex-none"
              >
                {{ $t('profile.delete') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- EDUCATION TAB -->
      <div v-else-if="activeTab === 'education'" class="bg-white rounded-lg md:rounded-2xl shadow-sm p-4 md:p-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 class="text-base md:text-lg font-semibold">{{ $t('education') }}</h2>
          <button
            @click="addEducation"
            class="px-3 md:px-4 py-2 text-xs md:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-h-10 whitespace-nowrap"
          >
            + {{ $t('profile.addEducation') }}
          </button>
        </div>

        <div
          v-if="educations.length === 0"
          class="text-sm text-gray-500 text-center py-8"
        >
          {{ $t('profile.noEducationAdded') }}
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="edu in educations"
            :key="edu.id"
            class="border rounded-lg p-4"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <input
                v-model="edu.institution_name"
                :placeholder="$t('profile.institution')"
                class="rounded-lg border px-3 py-2 text-xs md:text-sm min-h-10"
              />
              <input
                v-model="edu.degree"
                :placeholder="$t('profile.degree')"
                class="rounded-lg border px-3 py-2 text-xs md:text-sm min-h-10"
              />
              <input
                v-model="edu.major"
                :placeholder="$t('profile.major')"
                class="rounded-lg border px-3 py-2 text-xs md:text-sm min-h-10"
              />
              <input
                v-model="edu.start_date"
                type="date"
                class="rounded-lg border px-3 py-2 text-xs md:text-sm min-h-10"
              />
              <input
                v-model="edu.end_date"
                type="date"
                :disabled="edu.is_current"
                class="rounded-lg border px-3 py-2 text-xs md:text-sm min-h-10"
              />
            </div>
            <label class="flex items-center gap-2 text-xs md:text-sm mb-3">
              <input
                type="checkbox"
                v-model="edu.is_current"
                class="rounded"
              />
              {{ $t('profile.currentlyStudyingHere') }}
            </label>
            <textarea
              v-model="edu.description"
              :placeholder="$t('profile.descriptionPlaceholder')"
              rows="2"
              class="w-full rounded-lg border px-3 py-2 text-xs md:text-sm mb-3 min-h-10"
            />
            <div class="flex flex-col sm:flex-row gap-2">
              <button
                @click="saveEducation(edu)"
                class="px-3 md:px-4 py-2 text-xs md:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-h-10 flex-1 sm:flex-none"
              >
                {{ $t('profile.save') }}
              </button>
              <button
                @click="deleteEducation(edu.id)"
                class="px-3 md:px-4 py-2 text-xs md:text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 min-h-10 flex-1 sm:flex-none"
              >
                {{ $t('profile.delete') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- CERTIFICATIONS TAB -->
      <div v-else-if="activeTab === 'certifications'" class="bg-white rounded-lg md:rounded-2xl shadow-sm p-4 md:p-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 class="text-base md:text-lg font-semibold">{{ $t('profile.certifications') }}</h2>
          <button
            @click="addCertification"
            class="px-3 md:px-4 py-2 text-xs md:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-h-10 whitespace-nowrap"
          >
            + {{ $t('profile.addCertification') }}
          </button>
        </div>

        <div
          v-if="certifications.length === 0"
          class="text-sm text-gray-500 text-center py-8"
        >
          {{ $t('profile.noCertificationsAdded') }}
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="cert in certifications"
            :key="cert.id"
            class="border rounded-lg p-4"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <input
                v-model="cert.name"
                :placeholder="$t('profile.certificationName')"
                class="rounded-lg border px-3 py-2 text-xs md:text-sm min-h-10"
                @input="cert.isSaved = false"
              />
              <input
                v-model="cert.issuer"
                :placeholder="$t('profile.issuingOrganization')"
                class="rounded-lg border px-3 py-2 text-xs md:text-sm min-h-10"
                @input="cert.isSaved = false"
              />
              <input
                v-model="cert.issue_date"
                type="date"
                :placeholder="$t('profile.issueDate')"
                class="rounded-lg border px-3 py-2 text-xs md:text-sm min-h-10"
                @input="cert.isSaved = false"
              />
              <input
                v-model="cert.expiry_date"
                type="date"
                :placeholder="$t('profile.expiryDateOptional')"
                class="rounded-lg border px-3 py-2 text-xs md:text-sm min-h-10"
                @input="cert.isSaved = false"
              />
              <input
                v-model="cert.credential_id"
                :placeholder="$t('profile.credentialID')"
                class="rounded-lg border px-3 py-2 text-xs md:text-sm min-h-10"
                @input="cert.isSaved = false"
              />
              <input
                v-model="cert.link"
                :placeholder="$t('profile.credentialURL')"
                class="rounded-lg border px-3 py-2 text-xs md:text-sm min-h-10"
                @input="cert.isSaved = false"
              />
            </div>
            <label class="flex items-center gap-2 text-xs md:text-sm mb-3">
              <input
                type="checkbox"
                v-model="cert.is_active"
                class="rounded"
                @change="cert.isSaved = false"
              />
              {{ $t('profile.activeCertification') }}
            </label>
            <div class="flex flex-col sm:flex-row gap-2">
              <button
                @click="saveCertification(cert)"
                class="px-3 md:px-4 py-2 text-xs md:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-h-10 flex-1 sm:flex-none"
                :class="{ 'opacity-50': cert.isSaved }"
              >
                {{ cert.isSaved ? $t('profile.saved') : $t('profile.save') }}
              </button>
              <button
                @click="deleteCertification(cert.id)"
                class="px-3 md:px-4 py-2 text-xs md:text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 min-h-10 flex-1 sm:flex-none"
              >
                {{ $t('profile.delete') }}
              </button>
            </div>
          </div>
        </div>
      </div>



      <!-- CV PARSER TAB -->
      <div v-else-if="activeTab === 'cvparser'" class="bg-white rounded-lg md:rounded-2xl shadow-sm p-4 md:p-6">
        <div class="mb-6">
          <h2 class="text-base md:text-lg font-semibold mb-1">{{ $t('profile.cvParser.title') }}</h2>
          <p class="text-xs md:text-sm text-gray-500">{{ $t('profile.cvParser.subtitle') }}</p>
        </div>

        <!-- Upload Section -->
        <div class="rounded-xl border border-dashed border-blue-300 bg-blue-50 p-4 md:p-6 mb-6">
          <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div class="flex-1">
              <label class="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                {{ $t('profile.cvParser.uploadLabel') }}
              </label>
              <input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                ref="cvParserFileInput"
                class="w-full text-xs md:text-sm rounded-lg border border-gray-200 bg-white px-3 py-2 min-h-10"
              />
              <p class="text-[10px] md:text-xs text-gray-500 mt-1">{{ $t('profile.cvParser.acceptedFormats') }}</p>
            </div>
            <button
              @click="parseCVFile"
              :disabled="cvParserLoading"
              class="px-4 py-2 min-h-10 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
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
        <div v-else-if="cvParserError && !cvParsedData" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {{ cvParserError }}
        </div>

        <!-- Parsed Results -->
        <div v-else-if="cvParsedData" class="space-y-6">
          <div class="flex items-center gap-2 mb-2">
            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="text-sm font-semibold text-gray-700">{{ $t('profile.cvParser.parseSuccess') }}</span>
          </div>

          <!-- Badge helper -->
          <!-- Personal Info Section -->
          <div class="border rounded-xl p-4">
            <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 class="text-sm font-semibold text-gray-800">{{ $t('profile.personalInfo') }}</h3>
              <button
                @click="applyParsedPersonalInfo"
                class="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {{ $t('profile.cvParser.applyToProfile') }}
              </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div v-if="cvParsedData.name" class="bg-gray-50 rounded-lg px-3 py-2">
                <span class="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded mb-1">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                  {{ $t('profile.cvParser.foundInCV') }}
                </span>
                <p class="text-xs text-gray-500">{{ $t('profile.fullNameLabel') }}</p>
                <p class="text-sm font-medium text-gray-800">{{ cvParsedData.name }}</p>
              </div>
              <div v-if="cvParsedData.email" class="bg-gray-50 rounded-lg px-3 py-2">
                <span class="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded mb-1">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                  {{ $t('profile.cvParser.foundInCV') }}
                </span>
                <p class="text-xs text-gray-500">{{ $t('profile.email') }}</p>
                <p class="text-sm font-medium text-gray-800">{{ cvParsedData.email }}</p>
              </div>
              <div v-if="cvParsedData.phone || cvParsedData.telephone" class="bg-gray-50 rounded-lg px-3 py-2">
                <span class="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded mb-1">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                  {{ $t('profile.cvParser.foundInCV') }}
                </span>
                <p class="text-xs text-gray-500">{{ $t('profile.phone') }}</p>
                <p class="text-sm font-medium text-gray-800">{{ cvParsedData.phone || cvParsedData.telephone }}</p>
              </div>
              <div v-if="cvParsedData.date_of_birth" class="bg-gray-50 rounded-lg px-3 py-2">
                <span class="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded mb-1">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                  {{ $t('profile.cvParser.foundInCV') }}
                </span>
                <p class="text-xs text-gray-500">{{ $t('profile.dateOfBirth') }}</p>
                <p class="text-sm font-medium text-gray-800">{{ cvParsedData.date_of_birth }}</p>
              </div>
              <div v-if="cvParsedData.address" class="bg-gray-50 rounded-lg px-3 py-2 sm:col-span-2">
                <span class="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded mb-1">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                  {{ $t('profile.cvParser.foundInCV') }}
                </span>
                <p class="text-xs text-gray-500">{{ $t('profile.address') }}</p>
                <p class="text-sm font-medium text-gray-800">{{ cvParsedData.address }}</p>
              </div>
              <div v-if="cvParsedData.summary || cvParsedData.profile_summary" class="bg-gray-50 rounded-lg px-3 py-2 sm:col-span-2">
                <span class="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded mb-1">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                  {{ $t('profile.cvParser.foundInCV') }}
                </span>
                <p class="text-xs text-gray-500">{{ $t('profile.profileSummary') }}</p>
                <p class="text-sm text-gray-800 line-clamp-4">{{ cvParsedData.summary || cvParsedData.profile_summary }}</p>
              </div>
            </div>
          </div>

          <!-- Skills Section -->
          <div v-if="cvParsedData.skills && cvParsedData.skills.length" class="border rounded-xl p-4">
            <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 class="text-sm font-semibold text-gray-800">{{ $t('profile.skills') }}</h3>
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
            <p class="text-xs text-gray-400 mt-2">{{ $t('profile.cvParser.skillsHint') }}</p>
          </div>

          <!-- Work Experience Section -->
          <div v-if="cvParsedData.work_experiences && cvParsedData.work_experiences.length" class="border rounded-xl p-4">
            <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 class="text-sm font-semibold text-gray-800">{{ $t('profile.workExperience') }}</h3>
              <button
                @click="applyAllParsedWorkExp"
                class="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {{ $t('profile.cvParser.applyAll') }}
              </button>
            </div>
            <div class="space-y-3">
              <div
                v-for="(exp, idx) in cvParsedData.work_experiences"
                :key="idx"
                class="bg-gray-50 rounded-lg p-3"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <span class="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded mb-2">
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                      {{ $t('profile.cvParser.foundInCV') }}
                    </span>
                    <p class="text-sm font-semibold text-gray-800">{{ exp.job_title }}</p>
                    <p class="text-xs text-gray-600">{{ exp.company_name }}</p>
                    <p class="text-xs text-gray-400 mt-0.5">
                      {{ exp.start_date }} – {{ exp.is_current ? $t('profile.currentlyWorkingHere') : (exp.end_date || '-') }}
                    </p>
                    <p v-if="exp.description" class="text-xs text-gray-600 mt-1 line-clamp-2">{{ exp.description }}</p>
                  </div>
                  <button
                    @click="applyParsedWorkExp(exp)"
                    class="shrink-0 text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    {{ $t('profile.cvParser.apply') }}
                  </button>
                </div>
              </div>
            </div>
            <p class="text-xs text-gray-400 mt-2">{{ $t('profile.cvParser.applyHint') }}</p>
          </div>

          <!-- Education Section -->
          <div v-if="cvParsedData.educations && cvParsedData.educations.length" class="border rounded-xl p-4">
            <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 class="text-sm font-semibold text-gray-800">{{ $t('education') }}</h3>
              <button
                @click="applyAllParsedEducation"
                class="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {{ $t('profile.cvParser.applyAll') }}
              </button>
            </div>
            <div class="space-y-3">
              <div
                v-for="(edu, idx) in cvParsedData.educations"
                :key="idx"
                class="bg-gray-50 rounded-lg p-3"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <span class="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded mb-2">
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                      {{ $t('profile.cvParser.foundInCV') }}
                    </span>
                    <p class="text-sm font-semibold text-gray-800">{{ edu.degree }} <span v-if="edu.major">– {{ edu.major }}</span></p>
                    <p class="text-xs text-gray-600">{{ edu.institution_name }}</p>
                    <p class="text-xs text-gray-400 mt-0.5">
                      {{ edu.start_date }} – {{ edu.is_current ? $t('profile.currentlyStudyingHere') : (edu.end_date || '-') }}
                    </p>
                  </div>
                  <button
                    @click="applyParsedEducation(edu)"
                    class="shrink-0 text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    {{ $t('profile.cvParser.apply') }}
                  </button>
                </div>
              </div>
            </div>
            <p class="text-xs text-gray-400 mt-2">{{ $t('profile.cvParser.applyHint') }}</p>
          </div>

          <!-- Certifications Section -->
          <div v-if="cvParsedData.certifications && cvParsedData.certifications.length" class="border rounded-xl p-4">
            <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 class="text-sm font-semibold text-gray-800">{{ $t('profile.certifications') }}</h3>
              <button
                @click="applyAllParsedCertifications"
                class="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {{ $t('profile.cvParser.applyAll') }}
              </button>
            </div>
            <div class="space-y-3">
              <div
                v-for="(cert, idx) in cvParsedData.certifications"
                :key="idx"
                class="bg-gray-50 rounded-lg p-3"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <span class="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded mb-2">
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                      {{ $t('profile.cvParser.foundInCV') }}
                    </span>
                    <p class="text-sm font-semibold text-gray-800">{{ cert.name }}</p>
                    <p class="text-xs text-gray-600">{{ cert.issuer }}</p>
                    <p class="text-xs text-gray-400 mt-0.5">{{ cert.issue_date }}</p>
                  </div>
                  <button
                    @click="applyParsedCertification(cert)"
                    class="shrink-0 text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    {{ $t('profile.cvParser.apply') }}
                  </button>
                </div>
              </div>
            </div>
            <p class="text-xs text-gray-400 mt-2">{{ $t('profile.cvParser.applyHint') }}</p>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'applied'" class="space-y-4">
        <div v-if="loadingApplied" class="text-xs md:text-sm text-gray-500">
          {{ $t('profile.loadingAppliedJobs') }}
        </div>
        <div v-else-if="appliedError" class="text-xs md:text-sm text-red-600">
          {{ appliedError }}
        </div>
        <div v-else-if="!appliedJobCards.length" class="text-xs md:text-sm text-gray-500">
          {{ $t('profile.noAppliedJobs') }}
        </div>

        <div v-else class="space-y-3 md:space-y-4">
          <div
            v-for="item in appliedJobs"
            :key="item.id || item.application_id || item.job_id"
            class="bg-white rounded-lg md:rounded-lg shadow hover:shadow-lg transition-shadow p-3 md:p-5 cursor-pointer"
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
                  class="w-14 h-14 md:w-16 md:h-16 rounded shadow-sm"
                />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <h3 class="text-sm md:text-lg font-semibold text-gray-900 hover:text-blue-600 line-clamp-2">
                    {{
                      item.job?.title ||
                      item.job_title ||
                      item.title ||
                      $t('profile.untitledJob')
                    }}
                  </h3>
                  <span
                    class="inline-flex items-center gap-1 px-2 py-0.5 md:py-1 bg-green-100 text-green-700 text-[10px] md:text-xs font-medium rounded-full whitespace-nowrap shrink-0"
                  >
                    <svg
                      class="w-2.5 h-2.5 md:w-3 md:h-3"
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
                <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-[11px] md:text-sm text-gray-600 mb-3">
                  <div class="flex items-center gap-1 min-w-0">
                    <svg
                      class="w-3 h-3 md:w-4 md:h-4 shrink-0"
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
                      class="w-3 h-3 md:w-4 md:h-4 shrink-0"
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
                <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-[11px] md:text-sm mb-2">
                  <div class="flex items-center gap-1 text-green-600 font-semibold whitespace-nowrap">
                    <span v-if="item.job?.salary_min">{{ formatNumber(item.job?.salary_min) }} {{ item.job?.currency }}</span>
                    <span v-if="item.job?.salary_min && item.job?.salary_max">-</span>
                    <span v-if="item.job?.salary_max">{{ formatNumber(item.job?.salary_max) }} {{ item.job?.currency }}</span>
                  </div>
                  <div class="flex items-center gap-1 text-gray-500">
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span>{{ item.job?.employment_type || item.employment_type || "-" }}</span>
                  </div>
                  <div class="flex items-center gap-1 text-gray-500">
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{{ formatDate(item.applied_at || item.created_at) }}</span>
                  </div>
                </div>
                <p class="text-sm text-gray-600 line-clamp-2">
                  {{ item.job?.description || item.description || "-" }}
                </p>
              </div>
              <div class="flex items-center">
                <svg
                  class="w-5 h-5 text-gray-400"
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

      <div v-else class="space-y-4">
        <div v-if="loadingSaved" class="text-xs md:text-sm text-gray-500">
          {{ $t('profile.loadingSavedJobs') }}
        </div>
        <div v-else-if="savedError" class="text-xs md:text-sm text-red-600">
          {{ savedError }}
        </div>
        <div v-else-if="!savedJobCards.length" class="text-xs md:text-sm text-gray-500">
          {{ $t('profile.noSavedJobs') }}
        </div>

        <div v-else class="space-y-3 md:space-y-4">
          <div
            v-for="job in savedJobCards"
            :key="job.job_post_id"
            class="bg-white rounded-lg md:rounded-lg shadow hover:shadow-lg transition-shadow p-3 md:p-5 cursor-pointer group"
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
                  class="w-14 h-14 md:w-16 md:h-16 rounded shadow-sm"
                />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <h3 class="text-sm md:text-lg font-semibold text-gray-900 hover:text-blue-600 line-clamp-2">
                    {{ job.title || $t('profile.untitledJob') }}
                  </h3>
                  <span
                    class="inline-flex items-center gap-1 px-2 py-0.5 md:py-1 bg-amber-100 text-amber-700 text-[10px] md:text-xs font-medium rounded-full whitespace-nowrap shrink-0"
                  >
                    <svg
                      class="w-2.5 h-2.5 md:w-3 md:h-3"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      />
                    </svg>
                    Saved
                  </span>
                </div>
                <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-[11px] md:text-sm text-gray-600 mb-2">
                  <div class="flex items-center gap-1 min-w-0">
                    <svg
                      class="w-3 h-3 md:w-4 md:h-4 shrink-0"
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
                      class="w-3 h-3 md:w-4 md:h-4 shrink-0"
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
                  <div class="flex items-center gap-1 text-green-600 font-semibold">
                    <span v-if="job.salary_min">{{ formatNumber(job.salary_min) }} {{ job.currency }}</span>
                    <span v-if="job.salary_min && job.salary_max">-</span>
                    <span v-if="job.salary_max">{{ formatNumber(job.salary_max) }} {{ job.currency }}</span>
                  </div>
                  <div class="flex items-center gap-1 text-gray-500">
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span>{{ job.employment_type || "-" }}</span>
                  </div>
                </div>
                <p class="text-sm text-gray-600 line-clamp-2">
                  {{ job.description || "-" }}
                </p>
              </div>
              <div class="flex items-center">
                <button
                  @click.stop="handleRemoveSaved(job)"
                  class="text-red-600 hover:text-red-800 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="{{ $t('profile.removeFromSaved') }}"
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

    <!-- Skills Modal -->
    <div
      v-if="showSkillModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeSkillModal"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">{{ $t('profile.addSkillsButton') }}</h3>
          <button
            @click="closeSkillModal"
            class="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        <!-- Search Input -->
        <input
          v-model="skillSearchQuery"
          @input="handleSkillSearch"
          @keydown.enter.prevent="handleSkillEnter"
          type="text"
          :placeholder="$t('profile.searchOrCreateSkill')"
          class="w-full border border-gray-200 shadow-sm rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
        />

        <!-- Suggestions -->
        <div
          v-if="skillSuggestions.length"
          class="space-y-2 mb-4 max-h-48 overflow-y-auto"
        >
          <div
            v-for="skill in skillSuggestions"
            :key="skill.id"
            @click="addSkillFromSuggestion(skill)"
            class="p-2 border border-gray-200 rounded cursor-pointer hover:bg-blue-50 text-sm"
          >
            {{ skill.name }}
          </div>
        </div>

        <!-- Create New Skill -->
        <div v-if="skillSearchQuery && !skillSuggestions.length" class="mb-3">
          <button
            @click="createAndAddSkill(skillSearchQuery)"
            class="w-full p-2 border-2 border-dashed border-green-300 rounded text-sm text-green-700 hover:bg-green-50"
          >
            + {{ $t('profile.createSkill') }} "{{ skillSearchQuery }}"
          </button>
        </div>

        <!-- Loading -->
        <p v-if="loadingSkills" class="text-xs text-gray-500 text-center">
          {{ $t('profile.loadingSkills') }}
        </p>

        <!-- Close Button -->
        <button
          @click="closeSkillModal"
          class="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm"
        >
          {{ $t('profile.done') }}
        </button>
      </div>
    </div>

    <!-- Language Modal -->
    <div
      v-if="showLanguageModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeLanguageModal"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">
            {{ editingLanguageId ? $t('profile.editLanguage') : $t('profile.addLanguageButton') }}
          </h3>
          <button
            @click="closeLanguageModal"
            class="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        <!-- Language name with master suggestions -->
        <label class="text-xs md:text-sm font-medium text-gray-700">
          {{ $t('profile.languageName') }}
        </label>
        <div class="relative mb-3">
          <input
            :value="languageForm.language_name"
            @input="handleLanguageSearch"
            type="text"
            :placeholder="$t('profile.searchOrTypeLanguage')"
            class="w-full border border-gray-200 shadow-sm rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div
            v-if="languageSuggestions.length"
            class="absolute z-10 bg-white shadow-lg w-full mt-1 max-h-48 overflow-y-auto border border-gray-200 rounded-md"
          >
            <div
              v-for="lang in languageSuggestions"
              :key="lang.id"
              @click="selectLanguageSuggestion(lang)"
              class="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50"
            >
              {{ lang.name }}
            </div>
          </div>
          <p v-if="loadingLanguageOptions" class="text-xs text-gray-500 mt-1">
            {{ $t('profile.loadingLanguages') }}
          </p>
        </div>

        <!-- Proficiency level -->
        <label class="text-xs md:text-sm font-medium text-gray-700">
          {{ $t('profile.proficiencyLevel') }}
        </label>
        <select
          v-model="languageForm.proficiency_level_id"
          class="w-full border border-gray-200 shadow-sm rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
        >
          <option value="" disabled>{{ $t('profile.selectProficiency') }}</option>
          <option v-for="level in proficiencyOptions" :key="level.id" :value="level.id">
            {{ level.label }}
          </option>
        </select>

        <!-- Primary language -->
        <label class="flex items-center gap-2 text-sm text-gray-700 mb-4">
          <input v-model="languageForm.is_primary" type="checkbox" class="rounded" />
          {{ $t('profile.setAsPrimaryLanguage') }}
        </label>

        <div class="flex gap-2">
          <button
            @click="closeLanguageModal"
            class="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm"
          >
            {{ $t('profile.cancel') }}
          </button>
          <button
            @click="saveLanguage"
            :disabled="savingLanguage"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
          >
            {{ savingLanguage ? $t('profile.saving') : $t('profile.save') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
