<script setup>
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import { useCommunicationStore, applyMergeFields } from "@/stores/communicationStore";

const { t } = useI18n();
const communicationStore = useCommunicationStore();

const props = defineProps({
  open: { type: Boolean, default: false },
  candidates: { type: Array, default: () => [] },
  jobPostId: { type: [String, Number], default: null },
  jobTitle: { type: String, default: "" },
});

const emit = defineEmits(["close", "sent", "manage-templates"]);

const selectedTemplateId = ref("");
const subject = ref("");
const body = ref("");
const submitting = ref(false);

const previewCandidate = computed(() => props.candidates[0] || {});

const previewSubject = computed(() =>
  applyMergeFields(subject.value, previewCandidate.value, { job_title: props.jobTitle }),
);
const previewBody = computed(() =>
  applyMergeFields(body.value, previewCandidate.value, { job_title: props.jobTitle }),
);

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return;
    selectedTemplateId.value = "";
    subject.value = "";
    body.value = t("communication.bulk.defaultBody");
    await communicationStore.fetchTemplates();
  },
);

watch(selectedTemplateId, (id) => {
  if (!id) return;
  const template = communicationStore.templates.find((tpl) => String(tpl.id) === String(id));
  if (!template) return;
  subject.value = template.subject || "";
  body.value = template.body || template.body_html || template.body_text || "";
});

async function submit() {
  if (!subject.value.trim() || !body.value.trim()) {
    push.error(t("communication.bulk.validationRequired"));
    return;
  }
  if (!props.candidates.length) {
    push.error(t("communication.bulk.noRecipients"));
    return;
  }

  try {
    submitting.value = true;
    const result = await communicationStore.sendBulk({
      template_id: selectedTemplateId.value || undefined,
      subject: subject.value.trim(),
      body: body.value.trim(),
      application_ids: props.candidates.map((c) => c.application_id),
      job_post_id: props.jobPostId || undefined,
    });

    const queued = result?.queued ?? props.candidates.length;
    const skipped = result?.skipped?.length || 0;
    push.success(t("communication.bulk.sendSuccess", { queued, skipped }));
    emit("sent", result);
    emit("close");
  } catch (err) {
    push.error(err?.response?.data?.message || t("communication.bulk.sendFailed"));
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4"
      @click.self="emit('close')"
    >
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h2 class="text-base font-semibold text-gray-900">{{ t("communication.bulk.sendTitle") }}</h2>
            <p class="text-xs text-gray-500 mt-0.5">
              {{ t("communication.bulk.recipientCount", { count: candidates.length }) }}
            </p>
          </div>
          <button type="button" class="text-gray-400 hover:text-gray-600" @click="emit('close')">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div class="flex flex-wrap gap-2">
            <span
              v-for="c in candidates.slice(0, 8)"
              :key="c.application_id"
              class="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-700"
            >
              {{ c.name || c.email }}
            </span>
            <span v-if="candidates.length > 8" class="text-xs text-gray-500 self-center">
              +{{ candidates.length - 8 }}
            </span>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-sm font-medium text-gray-700">{{ t("communication.templates.label") }}</label>
              <button type="button" class="text-xs text-blue-600 hover:underline" @click="emit('manage-templates')">
                {{ t("communication.templates.manage") }}
              </button>
            </div>
            <select
              v-model="selectedTemplateId"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{{ t("communication.templates.none") }}</option>
              <option v-for="tpl in communicationStore.templates" :key="tpl.id" :value="tpl.id">
                {{ tpl.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700">{{ t("communication.bulk.subject") }}</label>
            <input
              v-model="subject"
              type="text"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              :placeholder="t('communication.bulk.subjectPlaceholder')"
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700">{{ t("communication.bulk.body") }}</label>
            <p class="text-[11px] text-gray-400 mb-1">{{ t("communication.bulk.mergeFieldsHint") }}</p>
            <textarea
              v-model="body"
              rows="8"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>

          <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p class="text-xs font-semibold text-gray-500 uppercase mb-2">{{ t("communication.bulk.preview") }}</p>
            <p class="text-sm font-semibold text-gray-900">{{ previewSubject || "—" }}</p>
            <pre class="mt-2 text-sm text-gray-700 whitespace-pre-wrap font-sans">{{ previewBody || "—" }}</pre>
          </div>

          <p class="text-xs text-gray-500">{{ t("communication.bulk.gdprNotice") }}</p>
        </div>

        <div class="border-t border-gray-200 px-5 py-4 flex justify-end gap-2">
          <button
            type="button"
            class="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
            :disabled="submitting"
            @click="emit('close')"
          >
            {{ t("cancel") }}
          </button>
          <button
            type="button"
            class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            :disabled="submitting || communicationStore.sending"
            @click="submit"
          >
            {{ submitting ? t("communication.bulk.sending") : t("communication.bulk.sendEmail") }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
