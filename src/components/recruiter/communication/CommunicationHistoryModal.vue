<script setup>
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useCommunicationStore } from "@/stores/communicationStore";

const { t } = useI18n();
const communicationStore = useCommunicationStore();

const props = defineProps({
  open: { type: Boolean, default: false },
  jobPostId: { type: [String, Number], default: null },
});

const emit = defineEmits(["close"]);

const detailOpen = ref(false);

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) {
      detailOpen.value = false;
      return;
    }
    await communicationStore.fetchCampaigns({
      page: 1,
      limit: 20,
      job_post_id: props.jobPostId || undefined,
    });
  },
);

async function openDetail(campaign) {
  try {
    await communicationStore.fetchCampaignDetail(campaign.id);
    detailOpen.value = true;
  } catch {
    detailOpen.value = false;
  }
}

function statusLabel(status) {
  return t(`communication.history.status.${status}`, status);
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[90] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div class="absolute inset-0 bg-black/40" @click="emit('close')"></div>

      <div
        class="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        @click.stop
      >
        <div class="px-5 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div>
            <h2 class="text-lg font-bold text-gray-900">{{ t("communication.history.title") }}</h2>
            <p class="text-xs text-gray-500 mt-0.5">{{ t("communication.history.subtitle") }}</p>
          </div>
          <button type="button" class="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center" @click="emit('close')">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-5 min-h-0">
          <div v-if="detailOpen && communicationStore.activeCampaign" class="space-y-4">
            <button type="button" class="text-sm text-blue-600 hover:underline" @click="detailOpen = false">
              ← {{ t("communication.history.backToList") }}
            </button>
            <div>
              <h3 class="font-semibold text-gray-900">
                {{ communicationStore.activeCampaign.subject || t("communication.history.campaign") }}
              </h3>
              <p class="text-xs text-gray-500 mt-1">
                {{ formatDate(communicationStore.activeCampaign.created_at) }}
              </p>
            </div>
            <div class="overflow-x-auto border border-gray-200 rounded-lg">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 text-gray-600">
                  <tr>
                    <th class="text-left px-3 py-2">{{ t("communication.history.recipient") }}</th>
                    <th class="text-left px-3 py-2">{{ t("communication.history.email") }}</th>
                    <th class="text-left px-3 py-2">{{ t("communication.history.statusLabel") }}</th>
                    <th class="text-left px-3 py-2">{{ t("communication.history.sentAt") }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, idx) in communicationStore.activeCampaign.recipients || []"
                    :key="row.id || row.application_id || idx"
                    class="border-t border-gray-100"
                  >
                    <td class="px-3 py-2">{{ row.worker_name || row.name || row.application_id || "—" }}</td>
                    <td class="px-3 py-2">{{ row.email || "—" }}</td>
                    <td class="px-3 py-2">
                      <span class="inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                        {{ statusLabel(row.status) }}
                      </span>
                    </td>
                    <td class="px-3 py-2 text-gray-500">{{ formatDate(row.sent_at) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-else>
            <div v-if="communicationStore.loadingCampaigns" class="text-center text-gray-500 py-10">
              {{ t("loading") }}...
            </div>
            <div v-else-if="!communicationStore.campaigns.length" class="text-center text-gray-500 py-10">
              {{ t("communication.history.empty") }}
            </div>
            <ul v-else class="space-y-2">
              <li
                v-for="campaign in communicationStore.campaigns"
                :key="campaign.id"
                class="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                @click="openDetail(campaign)"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-gray-900 truncate">
                      {{ campaign.subject || t("communication.history.campaign") }}
                    </p>
                    <p class="text-xs text-gray-500 mt-0.5">
                      {{ formatDate(campaign.created_at) }}
                      ·
                      {{ t("communication.history.recipientCount", { count: campaign.total ?? campaign.recipient_count ?? campaign.recipients?.length ?? 0 }) }}
                    </p>
                  </div>
                  <span class="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 shrink-0">
                    {{ statusLabel(campaign.status || "queued") }}
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
