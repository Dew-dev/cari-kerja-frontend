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

/** Replace {{name}}, {{job_title}}, etc. for preview. */
export function applyMergeFields(text, candidate = {}, extras = {}) {
  const map = {
    name: candidate.name || "",
    email: candidate.email || "",
    job_title: candidate.job_post_title || extras.job_title || "",
    company_name: extras.company_name || "",
  };
  return String(text || "").replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) =>
    map[key] !== undefined ? map[key] : `{{${key}}}`,
  );
}

export const useCommunicationStore = defineStore("communication", () => {
  const templates = ref([]);
  const loadingTemplates = ref(false);
  const templatesError = ref(null);

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
    } catch (err) {
      console.error("[Communication] Failed to fetch templates:", err);
      templatesError.value = err;
      templates.value = [];
    } finally {
      loadingTemplates.value = false;
    }
  }

  async function createTemplate(payload) {
    const res = await createCommunicationTemplate({
      channel: "email",
      ...payload,
    });
    await fetchTemplates();
    return res.data?.data;
  }

  async function updateTemplate(id, payload) {
    const res = await updateCommunicationTemplate(id, payload);
    await fetchTemplates();
    return res.data?.data;
  }

  async function removeTemplate(id) {
    await deleteCommunicationTemplate(id);
    await fetchTemplates();
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

  async function fetchCampaigns({ page = 1, limit = 20 } = {}) {
    try {
      loadingCampaigns.value = true;
      const res = await getCommunicationCampaigns({ page, limit });
      campaigns.value = res.data?.data || [];
      campaignsMeta.value = res.data?.meta || { page, totalPage: 1, total: campaigns.value.length };
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
      preferences.value = res.data?.data || { email_opt_out: false };
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
      preferences.value = res.data?.data || { ...preferences.value, ...payload };
      return preferences.value;
    } finally {
      savingPreferences.value = false;
    }
  }

  return {
    templates,
    loadingTemplates,
    templatesError,
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
