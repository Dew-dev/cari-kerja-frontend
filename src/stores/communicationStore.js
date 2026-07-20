import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  getCommunicationTemplates,
  createCommunicationTemplate,
  updateCommunicationTemplate,
  deleteCommunicationTemplate,
  bulkSendCommunication,
  getCommunicationCampaigns,
  getCommunicationCampaign,
  getCommunicationPreferences,
  updateCommunicationPreferences,
} from "@/services/communication.api";

/** Replace {{candidate_name}}, {{job_title}}, etc. for client-side preview. */
export function applyMergeFields(text, candidate = {}, extras = {}) {
  const candidateName = candidate.name || candidate.worker_name || "";
  const jobTitle = candidate.job_post_title || extras.job_title || "";
  const map = {
    candidate_name: candidateName,
    job_title: jobTitle,
    // Legacy aliases for older templates
    name: candidateName,
    email: candidate.email || "",
    company_name: extras.company_name || "",
  };
  return String(text || "").replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) =>
    map[key] !== undefined ? map[key] : `{{${key}}}`,
  );
}

function normalizePreferencesPayload(res) {
  return res.data?.data ?? res.data ?? { email_opt_out: false };
}

const LOCAL_TEMPLATES_KEY = "ck_communication_templates";

function readLocalTemplates() {
  try {
    const raw = localStorage.getItem(LOCAL_TEMPLATES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalTemplates(list) {
  localStorage.setItem(LOCAL_TEMPLATES_KEY, JSON.stringify(list));
}

function makeLocalId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useCommunicationStore = defineStore("communication", () => {
  const templates = ref([]);
  const loadingTemplates = ref(false);
  const templatesError = ref(null);
  /** true when API unavailable and we persist templates in localStorage */
  const usingLocalTemplates = ref(false);

  const campaigns = ref([]);
  const loadingCampaigns = ref(false);
  const campaignsMeta = ref({ page: 1, totalPage: 1, total: 0 });
  const activeCampaign = ref(null);
  const loadingCampaignDetail = ref(false);

  const sending = ref(false);
  const lastSendResult = ref(null);

  const preferences = ref({ email_opt_out: false });
  const loadingPreferences = ref(false);
  const savingPreferences = ref(false);

  const hasTemplates = computed(() => templates.value.length > 0);

  async function fetchTemplates() {
    try {
      loadingTemplates.value = true;
      templatesError.value = null;
      const res = await getCommunicationTemplates();
      templates.value = res.data?.data || [];
      usingLocalTemplates.value = false;
    } catch (err) {
      console.warn("[Communication] Templates API unavailable, using local storage:", err);
      templatesError.value = null;
      usingLocalTemplates.value = true;
      templates.value = readLocalTemplates();
    } finally {
      loadingTemplates.value = false;
    }
  }

  async function createTemplate(payload) {
    const body = {
      channel: "email",
      name: payload.name,
      subject: payload.subject,
      body: payload.body,
    };

    if (!usingLocalTemplates.value) {
      try {
        const res = await createCommunicationTemplate(body);
        await fetchTemplates();
        return res.data?.data;
      } catch (err) {
        console.warn("[Communication] Create template API failed, falling back to local:", err);
        usingLocalTemplates.value = true;
      }
    }

    const now = new Date().toISOString();
    const created = {
      id: makeLocalId(),
      ...body,
      created_at: now,
      updated_at: now,
    };
    const next = [created, ...readLocalTemplates()];
    writeLocalTemplates(next);
    templates.value = next;
    return created;
  }

  async function updateTemplate(id, payload) {
    const body = {
      name: payload.name,
      subject: payload.subject,
      body: payload.body,
      channel: payload.channel || "email",
    };

    if (!usingLocalTemplates.value && !String(id).startsWith("local-")) {
      try {
        const res = await updateCommunicationTemplate(id, body);
        await fetchTemplates();
        return res.data?.data;
      } catch (err) {
        console.warn("[Communication] Update template API failed, falling back to local:", err);
        usingLocalTemplates.value = true;
      }
    }

    const next = readLocalTemplates().map((tpl) =>
      String(tpl.id) === String(id)
        ? { ...tpl, ...body, updated_at: new Date().toISOString() }
        : tpl,
    );
    writeLocalTemplates(next);
    templates.value = next;
    return next.find((tpl) => String(tpl.id) === String(id));
  }

  async function removeTemplate(id) {
    if (!usingLocalTemplates.value && !String(id).startsWith("local-")) {
      try {
        await deleteCommunicationTemplate(id);
        await fetchTemplates();
        return;
      } catch (err) {
        console.warn("[Communication] Delete template API failed, falling back to local:", err);
        usingLocalTemplates.value = true;
      }
    }

    const next = readLocalTemplates().filter((tpl) => String(tpl.id) !== String(id));
    writeLocalTemplates(next);
    templates.value = next;
  }

  async function sendBulk(payload) {
    try {
      sending.value = true;
      lastSendResult.value = null;
      const res = await bulkSendCommunication({
        channel: "email",
        ...payload,
      });
      lastSendResult.value = res.data?.data || res.data;
      return lastSendResult.value;
    } finally {
      sending.value = false;
    }
  }

  async function fetchCampaigns({ page = 1, limit = 20, job_post_id } = {}) {
    try {
      loadingCampaigns.value = true;
      const params = { page, limit };
      if (job_post_id) params.job_post_id = job_post_id;
      const res = await getCommunicationCampaigns(params);
      campaigns.value = res.data?.data || [];
      campaignsMeta.value = res.data?.meta || {
        page,
        totalPage: 1,
        total: campaigns.value.length,
      };
    } catch (err) {
      console.error("[Communication] Failed to fetch campaigns:", err);
      campaigns.value = [];
    } finally {
      loadingCampaigns.value = false;
    }
  }

  async function fetchCampaignDetail(id) {
    try {
      loadingCampaignDetail.value = true;
      const res = await getCommunicationCampaign(id);
      activeCampaign.value = res.data?.data || null;
      return activeCampaign.value;
    } catch (err) {
      console.error("[Communication] Failed to fetch campaign:", err);
      activeCampaign.value = null;
      throw err;
    } finally {
      loadingCampaignDetail.value = false;
    }
  }

  async function fetchPreferences() {
    try {
      loadingPreferences.value = true;
      const res = await getCommunicationPreferences();
      preferences.value = normalizePreferencesPayload(res);
    } catch (err) {
      console.error("[Communication] Failed to fetch preferences:", err);
      // Soft default when endpoint is not yet available
      preferences.value = { email_opt_out: false };
    } finally {
      loadingPreferences.value = false;
    }
  }

  async function savePreferences(payload) {
    try {
      savingPreferences.value = true;
      const res = await updateCommunicationPreferences(payload);
      preferences.value = normalizePreferencesPayload(res) || { ...preferences.value, ...payload };
      return preferences.value;
    } finally {
      savingPreferences.value = false;
    }
  }

  return {
    templates,
    loadingTemplates,
    templatesError,
    usingLocalTemplates,
    campaigns,
    loadingCampaigns,
    campaignsMeta,
    activeCampaign,
    loadingCampaignDetail,
    sending,
    lastSendResult,
    preferences,
    loadingPreferences,
    savingPreferences,
    hasTemplates,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    removeTemplate,
    sendBulk,
    fetchCampaigns,
    fetchCampaignDetail,
    fetchPreferences,
    savePreferences,
  };
});
