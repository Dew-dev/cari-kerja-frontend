<script setup>
import { ref, computed, onMounted } from "vue";
import { push } from "notivue";
import { getActivePlan, applySinglePostToJob } from "@/services/payments.api.js";

const props = defineProps({
  job: { type: Object, required: true },
  show: { type: Boolean, default: false },
});

const emit = defineEmits(["close", "success"]);

const activePlan = ref(null);
const loading = ref(true);
const applyLoading = ref(null);
const selectedSlotId = ref(null);

onMounted(async () => {
  try {
    const res = await getActivePlan();
    if (res?.data) activePlan.value = res.data;
  } catch {
    push.error("Gagal memuat slot satuan");
  } finally {
    loading.value = false;
  }
});

const availableSlots = computed(() => activePlan.value?.available_single_posts || []);

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

async function applySlot(slot) {
  if (applyLoading.value) return;
  applyLoading.value = slot.id;

  try {
    await applySinglePostToJob({
      single_post_slot_id: slot.id,
      job_post_id: props.job.id,
    });
    push.success(`Slot "${slot.plan_display_name}" berhasil diterapkan pada iklan!`);
    emit("success");
    emit("close");
  } catch (err) {
    const msg = err?.response?.data?.message || "Gagal menerapkan slot";
    push.error(msg);
  } finally {
    applyLoading.value = null;
  }
}

function close() {
  emit("close");
}
</script>

<template>
  <Transition name="fade">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @click.self="close"
    >
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-5">
          <div class="flex items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <i class="pi pi-file-edit text-white/80"></i>
                <span class="text-white font-bold text-lg">Gunakan Slot Satuan</span>
              </div>
              <p class="text-white/60 text-xs truncate max-w-xs">{{ job.title }}</p>
            </div>
            <button @click="close" class="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors text-white flex-shrink-0">
              <i class="pi pi-times text-sm"></i>
            </button>
          </div>
        </div>

        <!-- Body -->
        <div class="p-6">
          <div v-if="loading" class="flex justify-center py-10">
            <div class="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          </div>

          <div v-else-if="!availableSlots.length" class="text-center py-8">
            <div class="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i class="pi pi-wallet text-2xl text-gray-400"></i>
            </div>
            <h3 class="text-gray-700 font-semibold mb-1 text-sm">Tidak ada slot satuan</h3>
            <p class="text-gray-400 text-xs mb-4">Beli slot satuan untuk memposting iklan tanpa berlangganan.</p>
            <router-link
              to="/recruiter/pricing"
              @click="close"
              class="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all"
            >
              <i class="pi pi-shopping-cart"></i> Beli Slot Satuan
            </router-link>
          </div>

          <div v-else>
            <p class="text-gray-600 text-sm mb-4">
              Pilih slot satuan yang akan diterapkan pada iklan ini:
            </p>
            <div class="space-y-3 max-h-72 overflow-y-auto pr-1">
              <div
                v-for="slot in availableSlots"
                :key="slot.id"
                :class="[
                  'border rounded-xl p-4 transition-all cursor-pointer',
                  selectedSlotId === slot.id
                    ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-100 bg-gray-50 hover:border-blue-200 hover:bg-blue-50/50',
                ]"
                @click="selectedSlotId = slot.id"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-start gap-3">
                    <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      :class="slot.is_hot ? 'bg-orange-100' : 'bg-blue-100'">
                      <i :class="`pi ${slot.is_hot ? 'pi-fire text-orange-500' : 'pi-file-edit text-blue-600'} text-sm`"></i>
                    </div>
                    <div>
                      <div class="font-semibold text-gray-800 text-sm flex items-center gap-2">
                        {{ slot.plan_display_name }}
                        <span v-if="slot.is_hot" class="px-1.5 py-0.5 bg-orange-100 text-orange-600 text-xs font-bold rounded">HOT 🔥</span>
                      </div>
                      <div class="text-xs text-gray-500 mt-0.5">Kadaluarsa: {{ formatDate(slot.expires_at) }}</div>
                    </div>
                  </div>
                  <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
                    :class="selectedSlotId === slot.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'">
                    <i v-if="selectedSlotId === slot.id" class="pi pi-check text-white text-xs"></i>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-5 flex gap-3">
              <button
                @click="close"
                class="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-all"
              >
                Batal
              </button>
              <button
                @click="applySlot(availableSlots.find(s => s.id === selectedSlotId))"
                :disabled="!selectedSlotId || applyLoading !== null"
                class="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span v-if="applyLoading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span v-else><i class="pi pi-check mr-1"></i>Terapkan Slot</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
