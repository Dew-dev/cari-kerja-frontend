<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getActivePlan } from "@/services/payments.api.js";

const router = useRouter();
const route = useRoute();

const activePlan = ref(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const res = await getActivePlan();
    if (res?.data) activePlan.value = res.data;
  } catch (err) {
    // silently fail
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-green-950 to-emerald-900 flex items-center justify-center px-4 py-16">
    <div class="max-w-lg w-full text-center">

      <!-- Success animation circle -->
      <div class="relative mb-8 flex justify-center">
        <div class="w-28 h-28 bg-green-500/20 rounded-full flex items-center justify-center animate-pulse">
          <div class="w-20 h-20 bg-green-500/30 rounded-full flex items-center justify-center">
            <div class="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-xl shadow-green-500/40">
              <i class="pi pi-check text-3xl text-white font-bold"></i>
            </div>
          </div>
        </div>
        <!-- Sparkles -->
        <div class="absolute top-0 right-10 text-yellow-400 text-xl animate-bounce" style="animation-delay: 0.1s">✨</div>
        <div class="absolute bottom-2 left-8 text-green-400 text-lg animate-bounce" style="animation-delay: 0.3s">⭐</div>
        <div class="absolute top-4 left-16 text-blue-400 text-sm animate-bounce" style="animation-delay: 0.5s">🎉</div>
      </div>

      <!-- Title -->
      <h1 class="text-3xl md:text-4xl font-extrabold text-white mb-3">
        Pembayaran Berhasil!
      </h1>
      <p class="text-green-300/80 text-lg mb-6">
        Paket Anda akan segera diaktifkan secara otomatis.
      </p>

      <!-- Loading indicator -->
      <div v-if="loading" class="flex justify-center mb-8">
        <div class="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Active Plan Card -->
      <div v-if="!loading && activePlan?.subscription" class="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 mb-8 text-left">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 bg-green-500/30 rounded-xl flex items-center justify-center">
            <i class="pi pi-check-circle text-green-400 text-xl"></i>
          </div>
          <div>
            <div class="text-white font-semibold text-sm">Paket Aktif Sekarang</div>
            <div class="text-green-300 font-bold text-lg capitalize">{{ activePlan.subscription.plan_display_name }}</div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div class="bg-white/8 rounded-lg p-3">
            <div class="text-white/50 text-xs mb-1">Maks. Iklan Aktif</div>
            <div class="text-white font-bold text-xl">{{ activePlan.max_active_posts }}</div>
          </div>
          <div class="bg-white/8 rounded-lg p-3">
            <div class="text-white/50 text-xs mb-1">Berlaku Hingga</div>
            <div class="text-white font-semibold text-sm">
              {{ new Date(activePlan.subscription.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Info if no subscription yet (might be single post or boost) -->
      <div v-else-if="!loading" class="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5 mb-8">
        <div class="flex items-center gap-3 text-left">
          <i class="pi pi-info-circle text-blue-400 text-2xl flex-shrink-0"></i>
          <div>
            <div class="text-white font-semibold text-sm">Pembayaran diterima</div>
            <div class="text-white/60 text-xs mt-1">Paket Anda sedang dalam proses aktivasi. Cek kembali dalam beberapa saat atau lihat riwayat transaksi.</div>
          </div>
        </div>
      </div>

      <!-- CTA Buttons -->
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <router-link
          to="/recruiter/jobs"
          class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-500/30 hover:shadow-green-400/40"
        >
          <i class="pi pi-briefcase"></i> Kelola Iklan Saya
        </router-link>
        <router-link
          to="/recruiter/orders"
          class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all"
        >
          <i class="pi pi-history"></i> Riwayat Transaksi
        </router-link>
      </div>

      <p class="mt-8 text-white/30 text-xs">
        Ada pertanyaan? Hubungi tim kami via halaman
        <router-link to="/contact" class="underline hover:text-white/60">Contact</router-link>.
      </p>
    </div>
  </div>
</template>
