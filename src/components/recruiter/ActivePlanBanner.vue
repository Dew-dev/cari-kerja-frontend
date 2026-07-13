<script setup>
import { ref, onMounted, computed } from "vue";
import { getActivePlan } from "@/services/payments.api.js";

const activePlan = ref(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const res = await getActivePlan();
    if (res?.data) activePlan.value = res.data;
  } catch {
    // silently fail
  } finally {
    loading.value = false;
  }
});

const planName = computed(() => activePlan.value?.subscription?.plan_display_name || "Free");
const maxPosts = computed(() => activePlan.value?.max_active_posts || 1);
const singleSlots = computed(() => activePlan.value?.single_post_slots || 0);
const expiresAt = computed(() => {
  const exp = activePlan.value?.subscription?.expires_at;
  if (!exp) return null;
  return new Date(exp).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
});
const isFree = computed(() => !activePlan.value?.subscription);

const planGradient = computed(() => {
  const name = activePlan.value?.subscription?.plan_name?.toLowerCase();
  const gradients = {
    starter:  "from-blue-500 to-blue-700",
    pro:      "from-violet-500 to-violet-700",
    business: "from-amber-500 to-orange-600",
  };
  return gradients[name] || "from-slate-500 to-slate-600";
});
</script>

<template>
  <div v-if="!loading" class="mb-6">
    <!-- FREE PLAN BANNER -->
    <div v-if="isFree" class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div class="flex items-center gap-3 flex-1">
        <div class="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow">
          <i class="pi pi-gift text-white text-sm"></i>
        </div>
        <div>
          <div class="font-semibold text-gray-800 text-sm">Paket Free — 1 iklan aktif</div>
          <div class="text-xs text-gray-500 mt-0.5">Upgrade untuk memposting lebih banyak lowongan sekaligus.</div>
        </div>
      </div>
      <router-link
        to="/recruiter/pricing"
        class="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-md hover:shadow-lg whitespace-nowrap"
      >
        <i class="pi pi-arrow-up text-xs"></i> Upgrade Paket
      </router-link>
    </div>

    <!-- PAID PLAN BANNER -->
    <div v-else :class="`bg-gradient-to-r ${planGradient} rounded-xl p-4 shadow-lg`">
      <div class="flex flex-col sm:flex-row sm:items-center gap-3">
        <div class="flex items-center gap-3 flex-1">
          <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <i class="pi pi-crown text-white text-sm"></i>
          </div>
          <div>
            <div class="text-white/80 text-xs font-medium uppercase tracking-wider">Paket Aktif</div>
            <div class="text-white font-bold text-sm">{{ planName }}</div>
          </div>
        </div>

        <!-- Stats -->
        <div class="flex items-center gap-4 sm:gap-6">
          <div class="text-center">
            <div class="text-white font-bold text-xl leading-none">{{ maxPosts }}</div>
            <div class="text-white/60 text-xs mt-0.5">Iklan maks.</div>
          </div>
          <div v-if="singleSlots > 0" class="text-center">
            <div class="text-white font-bold text-xl leading-none">{{ singleSlots }}</div>
            <div class="text-white/60 text-xs mt-0.5">Slot satuan</div>
          </div>
          <div v-if="expiresAt" class="text-center hidden sm:block">
            <div class="text-white font-semibold text-xs leading-none">{{ expiresAt }}</div>
            <div class="text-white/60 text-xs mt-0.5">Kadaluarsa</div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 sm:ml-4">
          <router-link
            to="/recruiter/pricing"
            class="inline-flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg transition-all whitespace-nowrap border border-white/30"
          >
            <i class="pi pi-arrow-up text-xs"></i> Upgrade
          </router-link>
          <router-link
            to="/recruiter/orders"
            class="inline-flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-all whitespace-nowrap border border-white/20"
          >
            <i class="pi pi-history text-xs"></i>
          </router-link>
        </div>
      </div>

      <!-- Expiry mobile -->
      <div v-if="expiresAt" class="sm:hidden mt-2 text-white/60 text-xs">
        <i class="pi pi-calendar text-xs mr-1"></i>Berlaku hingga {{ expiresAt }}
      </div>
    </div>
  </div>
</template>
