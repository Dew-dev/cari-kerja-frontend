<script setup>
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { getWorkerByApplication } from "@/services/applications";
import CandidateTimeline from "./CandidateTimeline.vue";

const { t } = useI18n();

const props = defineProps({
  candidate: { type: Object, default: null },
  open: { type: Boolean, default: false },
});

const emit = defineEmits(["close", "chat"]);

const linkStorageUrl = import.meta.env.VITE_FILE_STORAGE_URL || "";
const detail = ref(null);
const loading = ref(false);

async function loadDetail() {
  if (!props.candidate?.application_id) return;
  detail.value = null;
  loading.value = true;
  try {
    const res = await getWorkerByApplication(props.candidate.application_id);
    detail.value = res.data?.data;
  } catch (err) {
    console.error("[Pipeline] Failed to fetch candidate detail:", err);
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.open, props.candidate?.application_id],
  ([isOpen]) => {
    if (isOpen) loadDetail();
  },
  { immediate: true },
);
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="fixed inset-0 bg-black/40 z-40" @click="emit('close')"></div>
    </Transition>

    <Transition name="slide">
      <aside
        v-if="open && candidate"
        class="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-50 flex flex-col"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 class="text-base font-semibold text-gray-900">{{ t("pipeline.drawer.title") }}</h2>
          <button @click="emit('close')" class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <!-- Summary -->
          <div class="flex items-center gap-3">
            <div class="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
              <img v-if="candidate.avatar_url" :src="linkStorageUrl + candidate.avatar_url" class="w-full h-full object-cover" />
              <span v-else class="text-lg font-semibold text-gray-600">{{ candidate.name?.charAt(0)?.toUpperCase() }}</span>
            </div>
            <div class="min-w-0">
              <div class="font-semibold text-gray-900 truncate">{{ candidate.name }}</div>
              <div class="text-sm text-gray-500 truncate">{{ candidate.email }}</div>
              <div v-if="candidate.job_post_title" class="text-xs text-blue-600 truncate mt-0.5">{{ candidate.job_post_title }}</div>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              @click="emit('chat', candidate)"
              class="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {{ t("chat.chatButton") }}
            </button>

            <a
              v-if="detail?.resume_url"
              :href="linkStorageUrl + detail.resume_url"
              target="_blank"
              class="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {{ t("viewResume") }}
            </a>
          </div>

          <div v-if="loading" class="flex justify-center py-4">
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>

          <!-- Cover letter -->
          <div v-else-if="detail?.cover_letter">
            <h3 class="text-xs font-semibold text-gray-500 uppercase mb-1.5">{{ t("coverLetter") }}</h3>
            <p class="text-sm text-gray-700 whitespace-pre-line">{{ detail.cover_letter }}</p>
          </div>

          <!-- Timeline -->
          <div>
            <h3 class="text-xs font-semibold text-gray-500 uppercase mb-2">{{ t("pipeline.timeline.title") }}</h3>
            <CandidateTimeline :application-id="candidate.application_id" :applied-at="candidate.applied_at" />
          </div>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
