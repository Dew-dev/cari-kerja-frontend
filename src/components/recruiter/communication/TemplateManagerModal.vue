<script setup>
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import { useCommunicationStore } from "@/stores/communicationStore";

const { t } = useI18n();
const communicationStore = useCommunicationStore();

const props = defineProps({
  open: { type: Boolean, default: false },
});

const emit = defineEmits(["close"]);

const editingId = ref(null);
const form = ref({ name: "", subject: "", body: "" });
const saving = ref(false);

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return;
    resetForm();
    await communicationStore.fetchTemplates();
  },
);

function resetForm() {
  editingId.value = null;
  form.value = { name: "", subject: "", body: "" };
}

function startEdit(template) {
  editingId.value = template.id;
  form.value = {
    name: template.name || "",
    subject: template.subject || "",
    body: template.body || template.body_html || template.body_text || "",
  };
}

async function save() {
  if (!form.value.name.trim() || !form.value.subject.trim() || !form.value.body.trim()) {
    push.error(t("communication.templates.validationRequired"));
    return;
  }

  try {
    saving.value = true;
    const payload = {
      name: form.value.name.trim(),
      subject: form.value.subject.trim(),
      body: form.value.body.trim(),
      channel: "email",
    };
    if (editingId.value) {
      await communicationStore.updateTemplate(editingId.value, payload);
      push.success(t("communication.templates.updated"));
    } else {
      await communicationStore.createTemplate(payload);
      push.success(t("communication.templates.created"));
    }
    resetForm();
  } catch (err) {
    push.error(err?.response?.data?.message || t("communication.templates.saveFailed"));
  } finally {
    saving.value = false;
  }
}

async function remove(template) {
  if (!confirm(t("communication.templates.confirmDelete", { name: template.name }))) return;
  try {
    await communicationStore.removeTemplate(template.id);
    if (String(editingId.value) === String(template.id)) resetForm();
    push.success(t("communication.templates.deleted"));
  } catch (err) {
    push.error(err?.response?.data?.message || t("communication.templates.deleteFailed"));
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      @click.self="emit('close')"
    >
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div class="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-900">{{ t("communication.templates.title") }}</h2>
          <button type="button" class="text-gray-400 hover:text-gray-600" @click="emit('close')">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-gray-700">
              {{ editingId ? t("communication.templates.edit") : t("communication.templates.create") }}
            </h3>
            <input
              v-model="form.name"
              type="text"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              :placeholder="t('communication.templates.namePlaceholder')"
            />
            <input
              v-model="form.subject"
              type="text"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              :placeholder="t('communication.templates.subjectPlaceholder')"
            />
            <textarea
              v-model="form.body"
              rows="10"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-y"
              :placeholder="t('communication.templates.bodyPlaceholder')"
            />
            <p class="text-[11px] text-gray-400">{{ t("communication.bulk.mergeFieldsHint") }}</p>
            <div class="flex gap-2">
              <button
                type="button"
                class="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                :disabled="saving"
                @click="save"
              >
                {{ saving ? t("communication.templates.saving") : t("communication.templates.save") }}
              </button>
              <button
                v-if="editingId"
                type="button"
                class="px-4 py-2 text-sm rounded-lg border border-gray-300"
                @click="resetForm"
              >
                {{ t("communication.templates.cancelEdit") }}
              </button>
            </div>
          </div>

          <div>
            <h3 class="text-sm font-semibold text-gray-700 mb-3">{{ t("communication.templates.list") }}</h3>
            <div v-if="communicationStore.loadingTemplates" class="text-sm text-gray-500 py-8 text-center">
              {{ t("loading") }}...
            </div>
            <div v-else-if="communicationStore.templatesError" class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {{ t("communication.templates.unavailable") }}
            </div>
            <div v-else-if="!communicationStore.templates.length" class="text-sm text-gray-500 py-8 text-center">
              {{ t("communication.templates.empty") }}
            </div>
            <ul v-else class="space-y-2">
              <li
                v-for="tpl in communicationStore.templates"
                :key="tpl.id"
                class="border border-gray-200 rounded-lg p-3"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-gray-900 truncate">{{ tpl.name }}</p>
                    <p class="text-xs text-gray-500 truncate">{{ tpl.subject }}</p>
                  </div>
                  <div class="flex gap-1 shrink-0">
                    <button type="button" class="text-xs text-blue-600 px-2 py-1 hover:bg-blue-50 rounded" @click="startEdit(tpl)">
                      {{ t("communication.templates.editAction") }}
                    </button>
                    <button type="button" class="text-xs text-red-600 px-2 py-1 hover:bg-red-50 rounded" @click="remove(tpl)">
                      {{ t("communication.templates.deleteAction") }}
                    </button>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
