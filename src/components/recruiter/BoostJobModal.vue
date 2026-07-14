<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getAllPlans } from "@/services/payments.api.js";
import { push } from "notivue";

const props = defineProps({
  job:  { type: Object,  required: true },
  show: { type: Boolean, default: false },
});
const emit = defineEmits(["close"]);

const router      = useRouter();
const boostPlans  = ref([]);
const loading     = ref(true);

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

const hotPlans   = computed(() => boostPlans.value.filter((p) => p.boost_priority === 1));
const top10Plans = computed(() => boostPlans.value.filter((p) => p.boost_priority !== 1));

function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(amount);
}

function goToCheckout(plan) {
  emit("close");
  router.push({
    path: "/recruiter/checkout",
    query: { type: "boost", plan_id: plan.id, job_post_id: props.job.id },
  });
}

function close() { emit("close"); }
</script>

<template>
  <Transition name="fade">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4"
      @click.self="close"
    >
      <!-- Overlay -->
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      <!-- Modal — compact, light theme -->
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        <!-- Header — subtle light gradient -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-blue-50">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-chart-line text-blue-600 text-sm"></i>
            </div>
            <div>
              <div class="font-bold text-gray-800 text-sm leading-tight">Boost Iklan</div>
              <div class="text-gray-400 text-xs truncate max-w-[200px]">{{ job.title }}</div>
            </div>
          </div>
          <button
            @click="close"
            class="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-gray-500"
          >
            <i class="pi pi-times text-xs"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="p-4">

          <!-- Loading -->
          <div v-if="loading" class="flex justify-center py-8">
            <div class="w-7 h-7 border-3 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          </div>

          <div v-else>
            <!-- Empty -->
            <div v-if="!hotPlans.length && !top10Plans.length" class="text-center py-6 text-gray-400 text-sm">
              <i class="pi pi-info-circle text-xl mb-2 block"></i>
              Paket boost belum tersedia
            </div>

            <div v-else class="space-y-3">
              <!-- HOT Plans -->
              <div v-if="hotPlans.length">
                <div class="flex items-center gap-1.5 mb-2">
                  <span class="w-5 h-5 bg-amber-100 rounded flex items-center justify-center">
                    <i class="pi pi-star-fill text-amber-500 text-[10px]"></i>
                  </span>
                  <span class="text-xs font-bold text-gray-700 uppercase tracking-wide">HOT — Paling Atas</span>
                </div>
                <div
                  v-for="plan in hotPlans"
                  :key="plan.id"
                  class="flex items-center justify-between gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3"
                >
                  <div class="min-w-0">
                    <div class="font-semibold text-gray-800 text-sm truncate">{{ plan.display_name }}</div>
                    <div class="text-xs text-gray-500 mt-0.5">{{ plan.duration_days }} hari • Posisi teratas</div>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <span class="text-amber-600 font-bold text-sm">{{ formatRupiah(plan.price_idr) }}</span>
                    <button
                      @click="goToCheckout(plan)"
                      class="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white text-xs font-bold rounded-lg transition-all shadow-sm hover:shadow flex items-center gap-1"
                    >
                      <i class="pi pi-bolt text-[10px]"></i> Pilih
                    </button>
                  </div>
                </div>
              </div>

              <!-- Top-10 Plans -->
              <div v-if="top10Plans.length">
                <div class="flex items-center gap-1.5 mb-2">
                  <span class="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                    <i class="pi pi-chart-line text-blue-500 text-[10px]"></i>
                  </span>
                  <span class="text-xs font-bold text-gray-700 uppercase tracking-wide">Top-10 Harian</span>
                </div>
                <div
                  v-for="plan in top10Plans"
                  :key="plan.id"
                  class="flex items-center justify-between gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3"
                >
                  <div class="min-w-0">
                    <div class="font-semibold text-gray-800 text-sm truncate">{{ plan.display_name }}</div>
                    <div class="text-xs text-gray-500 mt-0.5">{{ plan.duration_days }} hari • 10 besar harian</div>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <span class="text-blue-600 font-bold text-sm">{{ formatRupiah(plan.price_idr) }}</span>
                    <button
                      @click="goToCheckout(plan)"
                      class="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white text-xs font-bold rounded-lg transition-all shadow-sm hover:shadow flex items-center gap-1"
                    >
                      <i class="pi pi-chart-line text-[10px]"></i> Pilih
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer note -->
            <p class="text-center text-gray-400 text-[11px] mt-4 flex items-center justify-center gap-1">
              <i class="pi pi-lock text-[10px]"></i>
              Aman via Xendit · Aktif otomatis setelah bayar
            </p>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.18s ease; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }
</style>
