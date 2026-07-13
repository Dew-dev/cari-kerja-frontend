<script setup>
import { ref, computed, onMounted } from "vue";
import { push } from "notivue";
import { getAllPlans, createInvoice } from "@/services/payments.api.js";

const props = defineProps({
  job: { type: Object, required: true },
  show: { type: Boolean, default: false },
});

const emit = defineEmits(["close", "success"]);

const boostPlans = ref([]);
const loading = ref(true);
const invoiceLoading = ref(null);

onMounted(async () => {
  try {
    const res = await getAllPlans("boost");
    boostPlans.value = res?.data?.boost || [];
  } catch {
    push.error("Gagal memuat paket boost");
  } finally {
    loading.value = false;
  }
});

function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(amount);
}

const hotPlans = computed(() => boostPlans.value.filter((p) => p.boost_priority === 1));
const top10Plans = computed(() => boostPlans.value.filter((p) => p.boost_priority !== 1));

async function buyBoost(plan) {
  if (invoiceLoading.value) return;
  invoiceLoading.value = plan.id;

  try {
    const payload = {
      order_type: "boost",
      plan_id: plan.id,
      job_post_id: props.job.id,
    };
    const res = await createInvoice(payload);
    if (res?.data?.payment_url) {
      window.open(res.data.payment_url, "_blank");
      push.success("Invoice boost berhasil dibuat! Selesaikan pembayaran di tab baru.");
      emit("success");
      emit("close");
    } else {
      push.error("Gagal membuat invoice boost.");
    }
  } catch (err) {
    const msg = err?.response?.data?.message || "Gagal membuat invoice boost";
    push.error(msg);
  } finally {
    invoiceLoading.value = null;
  }
}

function close() {
  emit("close");
}
</script>

<template>
  <!-- Backdrop -->
  <Transition name="fade">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @click.self="close"
    >
      <!-- Overlay -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

      <!-- Modal -->
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <!-- Header gradient -->
        <div class="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 px-6 py-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <i class="pi pi-chart-line text-blue-400"></i>
                <span class="text-white font-bold text-lg">Boost Iklan</span>
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
          <!-- Loading -->
          <div v-if="loading" class="flex justify-center py-10">
            <div class="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          </div>

          <div v-else>
            <!-- HOT Plans -->
            <div v-if="hotPlans.length" class="mb-5">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-6 h-6 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center">
                  <i class="pi pi-star-fill text-white text-xs"></i>
                </div>
                <span class="text-gray-800 font-bold text-sm">HOT — Paling Atas</span>
                <span class="text-xs text-gray-400 ml-1">Visibilitas maksimal</span>
              </div>
              <div class="grid grid-cols-1 gap-3">
                <div
                  v-for="plan in hotPlans"
                  :key="plan.id"
                  class="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <div class="font-semibold text-gray-800 text-sm">{{ plan.display_name }}</div>
                    <div class="text-xs text-gray-500 mt-0.5">{{ plan.duration_days }} hari • Posisi teratas</div>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="text-amber-600 font-bold text-sm whitespace-nowrap">{{ formatRupiah(plan.price_idr) }}</div>
                    <button
                      @click="buyBoost(plan)"
                      :disabled="invoiceLoading !== null"
                      class="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white text-xs font-bold rounded-lg transition-all shadow hover:shadow-md disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <span v-if="invoiceLoading === plan.id" class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span v-else><i class="pi pi-bolt text-xs"></i> Boost</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- TOP-10 Plans -->
            <div v-if="top10Plans.length">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                  <i class="pi pi-chart-line text-white text-xs"></i>
                </div>
                <span class="text-gray-800 font-bold text-sm">Top-10 Harian</span>
                <span class="text-xs text-gray-400 ml-1">Masuk 10 iklan teratas setiap hari</span>
              </div>
              <div class="grid grid-cols-1 gap-3">
                <div
                  v-for="plan in top10Plans"
                  :key="plan.id"
                  class="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <div class="font-semibold text-gray-800 text-sm">{{ plan.display_name }}</div>
                    <div class="text-xs text-gray-500 mt-0.5">{{ plan.duration_days }} hari • 10 besar harian</div>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="text-blue-600 font-bold text-sm whitespace-nowrap">{{ formatRupiah(plan.price_idr) }}</div>
                    <button
                      @click="buyBoost(plan)"
                      :disabled="invoiceLoading !== null"
                      class="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white text-xs font-bold rounded-lg transition-all shadow hover:shadow-md disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <span v-if="invoiceLoading === plan.id" class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span v-else><i class="pi pi-chart-line text-xs"></i> Boost</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty state -->
            <div v-if="!hotPlans.length && !top10Plans.length" class="text-center py-8 text-gray-400 text-sm">
              <i class="pi pi-info-circle text-2xl mb-2 block"></i>
              Paket boost belum tersedia
            </div>

            <!-- Info note -->
            <p class="mt-5 text-xs text-gray-400 text-center">
              <i class="pi pi-info-circle mr-1"></i>
              Pembayaran dilakukan via Xendit. Boost aktif otomatis setelah pembayaran berhasil.
            </p>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
