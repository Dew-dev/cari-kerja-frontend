<script setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import { openResumeInNewTab } from "@/utils/resumeUrl";

const props = defineProps({
  /** Resume object with id/resume_id and optional resume_url */
  resume: { type: Object, default: null },
  resumeId: { type: [String, Number], default: null },
  resumeUrl: { type: String, default: "" },
  label: { type: String, default: "" },
  buttonClass: {
    type: String,
    default:
      "inline-flex items-center justify-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline disabled:opacity-50",
  },
});

const { t } = useI18n();
const loading = ref(false);

async function onOpen() {
  if (loading.value) return;
  const resume = props.resume || {
    id: props.resumeId,
    resume_id: props.resumeId,
    resume_url: props.resumeUrl,
  };
  if (!resume?.id && !resume?.resume_id && !resume?.resume_url) return;

  try {
    loading.value = true;
    await openResumeInNewTab(resume);
  } catch (err) {
    push.error(t("resumeLink.unavailable"));
    console.warn("[resume] open failed:", err);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <button
    type="button"
    :class="buttonClass"
    :disabled="loading"
    @click.stop="onOpen"
  >
    <slot>{{ loading ? $t("resumeLink.opening") : label || $t("viewResume") }}</slot>
  </button>
</template>
