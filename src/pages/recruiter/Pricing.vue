<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { push } from "notivue";
import { getAllPlans, getActivePlan, createInvoice } from "@/services/payments.api.js";

const router = useRouter();

// ─── State ───────────────────────────────────────────────────────────────────
const plans = ref({ subscription: [], single_post: [], boost: [] });
const activePlan = ref(null);
const loading = ref(true);
const invoiceLoading = ref(null); // stores plan key being processed
const activeTab = ref("subscription"); // subscription | single_post | boost

// ─── Fetch Data ───────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const [plansRes, activePlanRes] = await Promise.all([
      getAllPlans(),
      getActivePlan().catch(() => null),
    ]);
    if (plansRes?.data) plans.value = plansRes.data;
    if (activePlanRes?.data) activePlan.value = activePlanRes.data;
  } catch (err) {
    push.error("Gagal memuat data paket");
  } finally {
    loading.value = false;
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatRupiah(amount) {
  if (amount === 0) return "Gratis";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

const currentPlanName = computed(() => {
  return activePlan.value?.subscription?.plan_name || "Free";
});

const currentMaxPosts = computed(() => {
  return activePlan.value?.max_active_posts || 1;
});

function isCurrentPlan(plan) {
  return activePlan.value?.subscription?.plan_name === plan.name;
}

// ─── Buy Plan ────────────────────────────────────────────────────────────────
async function buyPlan(orderType, plan) {
  const key = `${orderType}-${plan.id}`;
  if (invoiceLoading.value === key) return;
  invoiceLoading.value = key;

  try {
    const payload = { order_type: orderType, plan_id: plan.id };
    const res = await createInvoice(payload);

    if (res?.data?.payment_url) {
      window.open(res.data.payment_url, "_blank");
      push.success("Invoice berhasil dibuat! Selesaikan pembayaran di tab baru.");
    } else {
      push.error("Gagal membuat invoice. Coba lagi.");
    }
  } catch (err) {
    const msg = err?.response?.data?.message || "Gagal membuat invoice pembayaran";
    push.error(msg);
  } finally {
    invoiceLoading.value = null;
  }
}

// ─── Subscription Plan Icons & Gradient ──────────────────────────────────────
const subPlanMeta = {
  free:     { icon: "pi-gift",    gradient: "from-slate-500 to-slate-600",    badge: null,            features: ["1 iklan aktif", "Tanpa biaya", "Akses dasar"] },
  starter:  { icon: "pi-bolt",    gradient: "from-blue-500 to-blue-700",      badge: "Populer",       features: ["5 iklan aktif", "Berlaku 30 hari", "Semua fitur standar"] },
  pro:      { icon: "pi-crown",   gradient: "from-violet-500 to-violet-700",  badge: "Terbaik",       features: ["15 iklan aktif", "Berlaku 30 hari", "Prioritas dukungan"] },
  business: { icon: "pi-briefcase", gradient: "from-amber-500 to-orange-600", badge: "Enterprise",    features: ["25 iklan aktif", "Berlaku 30 hari", "Dukungan premium"] },
};

function getPlanMeta(planName) {
  return subPlanMeta[planName?.toLowerCase()] || subPlanMeta.starter;
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 py-12 px-4">
    <!-- Header -->
    <div class="max-w-6xl mx-auto text-center mb-12">
      <div class="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-white/80 text-sm mb-6 border border-white/20">
        <i class="pi pi-star-fill text-yellow-400"></i>
        Paket & Harga
      </div>
      <h1 class="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
        Tingkatkan Rekrutmen <br />
        <span class="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Tanpa Batas</span>
      </h1>
      <p class="text-lg text-white/60 max-w-xl mx-auto">
        Pilih paket yang sesuai kebutuhan bisnis Anda — dari gratis hingga enterprise.
      </p>

      <!-- Active Plan Status -->
      <div v-if="!loading && activePlan" class="mt-6 inline-flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-white">
        <div class="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></div>
        <span class="text-sm">Paket aktif: <strong class="text-green-300 capitalize">{{ currentPlanName }}</strong></span>
        <span class="text-white/40">•</span>
        <span class="text-sm text-white/70">{{ currentMaxPosts }} iklan maks.</span>
        <span class="text-white/40">•</span>
        <span class="text-sm text-white/70">{{ activePlan.single_post_slots || 0 }} slot satuan</span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="max-w-6xl mx-auto flex justify-center py-24">
      <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-white/60 text-sm">Memuat paket...</p>
      </div>
    </div>

    <div v-else class="max-w-6xl mx-auto">
      <!-- Tabs -->
      <div class="flex justify-center mb-10">
        <div class="inline-flex bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-1.5 gap-1">
          <button
            v-for="tab in [
              { key: 'subscription', label: 'Langganan', icon: 'pi-calendar' },
              { key: 'single_post', label: 'Iklan Satuan', icon: 'pi-file-edit' },
              { key: 'boost', label: 'Boost Iklan', icon: 'pi-chart-line' },
            ]"
            :key="tab.key"
            @click="activeTab = tab.key"
            :class="[
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300',
              activeTab === tab.key
                ? 'bg-white text-slate-900 shadow-lg'
                : 'text-white/60 hover:text-white hover:bg-white/10',
            ]"
          >
            <i :class="`pi ${tab.icon} text-xs`"></i>
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- =================== SUBSCRIPTION PLANS =================== -->
      <div v-if="activeTab === 'subscription'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="plan in plans.subscription"
          :key="plan.id"
          :class="[
            'relative rounded-2xl p-6 flex flex-col transition-all duration-300 group',
            isCurrentPlan(plan)
              ? 'ring-2 ring-green-400 bg-white/15 backdrop-blur shadow-2xl scale-105'
              : 'bg-white/8 backdrop-blur border border-white/15 hover:bg-white/12 hover:shadow-xl hover:-translate-y-1',
          ]"
        >
          <!-- Badge -->
          <div
            v-if="getPlanMeta(plan.name).badge"
            class="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-lg"
          >
            {{ getPlanMeta(plan.name).badge }}
          </div>

          <!-- Current badge -->
          <div v-if="isCurrentPlan(plan)" class="absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-bold bg-green-500 text-white">
            Aktif
          </div>

          <!-- Icon -->
          <div :class="`w-12 h-12 rounded-xl bg-gradient-to-br ${getPlanMeta(plan.name).gradient} flex items-center justify-center mb-4 shadow-lg`">
            <i :class="`pi ${getPlanMeta(plan.name).icon} text-white text-xl`"></i>
          </div>

          <!-- Name & Price -->
          <div class="mb-4">
            <h3 class="text-xl font-bold text-white capitalize">{{ plan.display_name }}</h3>
            <div class="mt-2">
              <span class="text-3xl font-extrabold text-white">{{ formatRupiah(plan.price_idr) }}</span>
              <span v-if="plan.price_idr > 0" class="text-white/50 text-sm ml-1">/ {{ plan.duration_days }} hari</span>
            </div>
          </div>

          <!-- Features -->
          <ul class="flex flex-col gap-2 mb-6 flex-1">
            <li v-for="f in getPlanMeta(plan.name).features" :key="f" class="flex items-center gap-2 text-sm text-white/70">
              <i class="pi pi-check-circle text-green-400 text-xs flex-shrink-0"></i>
              {{ f }}
            </li>
            <li class="flex items-center gap-2 text-sm text-white/70">
              <i class="pi pi-check-circle text-green-400 text-xs flex-shrink-0"></i>
              <strong class="text-white">{{ plan.max_active_posts }} iklan</strong> aktif bersamaan
            </li>
          </ul>

          <!-- CTA Button -->
          <button
            v-if="plan.price_idr === 0"
            disabled
            class="w-full py-3 rounded-xl text-sm font-semibold bg-white/10 text-white/40 cursor-not-allowed"
          >
            Paket Default
          </button>
          <button
            v-else-if="isCurrentPlan(plan)"
            disabled
            class="w-full py-3 rounded-xl text-sm font-semibold bg-green-500/20 text-green-300 cursor-not-allowed border border-green-500/30"
          >
            <i class="pi pi-check mr-2"></i>Paket Aktif
          </button>
          <button
            v-else
            @click="buyPlan('subscription', plan)"
            :disabled="invoiceLoading === `subscription-${plan.id}`"
            :class="[
              'w-full py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2',
              `bg-gradient-to-r ${getPlanMeta(plan.name).gradient} text-white hover:shadow-lg hover:scale-[1.02] active:scale-95`,
              invoiceLoading === `subscription-${plan.id}` ? 'opacity-70 cursor-wait' : '',
            ]"
          >
            <span v-if="invoiceLoading === `subscription-${plan.id}`" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span v-else><i class="pi pi-credit-card mr-1"></i>Pilih Paket</span>
          </button>
        </div>
      </div>

      <!-- =================== SINGLE POST PLANS =================== -->
      <div v-if="activeTab === 'single_post'" class="max-w-3xl mx-auto">
        <div class="text-center mb-8">
          <p class="text-white/60 text-sm">Beli iklan satuan tanpa berlangganan. Cocok untuk kebutuhan rekrutmen sesekali.</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div
            v-for="plan in plans.single_post"
            :key="plan.id"
            :class="[
              'relative rounded-2xl p-6 flex flex-col transition-all duration-300',
              plan.is_hot
                ? 'bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-400/40 hover:-translate-y-1'
                : 'bg-white/8 border border-white/15 hover:-translate-y-1',
            ]"
          >
            <!-- Hot Badge -->
            <div v-if="plan.is_hot" class="absolute -top-3 left-6 px-4 py-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-xs font-bold text-white flex items-center gap-1">
              <i class="pi pi-fire"></i> HOT
            </div>

            <!-- Icon -->
            <div :class="[
              'w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-lg',
              plan.is_hot ? 'bg-gradient-to-br from-orange-500 to-red-600' : 'bg-gradient-to-br from-blue-500 to-blue-700',
            ]">
              <i :class="`pi ${plan.is_hot ? 'pi-fire' : 'pi-file-edit'} text-white text-xl`"></i>
            </div>

            <!-- Name & Price -->
            <h3 class="text-xl font-bold text-white mb-1">{{ plan.display_name }}</h3>
            <p class="text-white/50 text-xs mb-3">Berlaku {{ plan.duration_days }} hari sejak aktivasi</p>
            <div class="text-3xl font-extrabold text-white mb-4">{{ formatRupiah(plan.price_idr) }}</div>

            <!-- Features -->
            <ul class="flex flex-col gap-2 mb-6 flex-1 text-sm text-white/70">
              <li class="flex items-center gap-2">
                <i class="pi pi-check-circle text-green-400 flex-shrink-0"></i>
                1 slot iklan pekerjaan
              </li>
              <li class="flex items-center gap-2">
                <i class="pi pi-check-circle text-green-400 flex-shrink-0"></i>
                Tanpa perlu berlangganan
              </li>
              <li v-if="plan.is_hot" class="flex items-center gap-2">
                <i class="pi pi-check-circle text-orange-400 flex-shrink-0"></i>
                <span class="text-orange-300 font-semibold">Tampil sebagai iklan HOT 🔥</span>
              </li>
              <li v-else class="flex items-center gap-2">
                <i class="pi pi-check-circle text-blue-400 flex-shrink-0"></i>
                Tampil sebagai iklan regular
              </li>
            </ul>

            <!-- CTA -->
            <button
              @click="buyPlan('single_post', plan)"
              :disabled="invoiceLoading === `single_post-${plan.id}`"
              :class="[
                'w-full py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2',
                plan.is_hot
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-lg hover:shadow-orange-500/30'
                  : 'bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/30',
                invoiceLoading === `single_post-${plan.id}` ? 'opacity-70 cursor-wait' : 'hover:scale-[1.02] active:scale-95',
              ]"
            >
              <span v-if="invoiceLoading === `single_post-${plan.id}`" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span v-else><i class="pi pi-shopping-cart mr-1"></i>Beli Sekarang</span>
            </button>
          </div>
        </div>

        <!-- Available Slots Info -->
        <div v-if="activePlan?.available_single_posts?.length" class="mt-8 bg-white/8 border border-white/15 rounded-2xl p-6">
          <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
            <i class="pi pi-wallet text-blue-400"></i>
            Slot Satuan Tersedia
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              v-for="slot in activePlan.available_single_posts"
              :key="slot.id"
              class="flex items-center justify-between bg-white/8 rounded-xl p-3 border border-white/10"
            >
              <div>
                <div class="text-white text-sm font-medium">{{ slot.plan_display_name }}</div>
                <div class="text-white/50 text-xs mt-0.5">Kadaluarsa: {{ new Date(slot.expires_at).toLocaleDateString('id-ID') }}</div>
              </div>
              <span v-if="slot.is_hot" class="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-xs font-bold">HOT</span>
            </div>
          </div>
          <p class="text-white/40 text-xs mt-4">
            <i class="pi pi-info-circle mr-1"></i>
            Gunakan slot ini saat memposting lowongan baru via halaman Jobs.
          </p>
        </div>
      </div>

      <!-- =================== BOOST PLANS =================== -->
      <div v-if="activeTab === 'boost'" class="max-w-4xl mx-auto">
        <div class="text-center mb-8">
          <p class="text-white/60 text-sm">Tingkatkan visibilitas iklan Anda agar dilihat lebih banyak pencari kerja.</p>
        </div>

        <!-- Boost tipe info cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div class="flex items-start gap-3 bg-blue-500/10 border border-blue-400/30 rounded-xl p-4">
            <div class="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <i class="pi pi-chart-line text-blue-400"></i>
            </div>
            <div>
              <div class="text-white font-semibold text-sm">Boost Top-10</div>
              <div class="text-white/50 text-xs mt-1">Iklan Anda muncul di 10 posisi teratas setiap hari dalam durasi paket.</div>
            </div>
          </div>
          <div class="flex items-start gap-3 bg-yellow-500/10 border border-yellow-400/30 rounded-xl p-4">
            <div class="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <i class="pi pi-star-fill text-yellow-400"></i>
            </div>
            <div>
              <div class="text-white font-semibold text-sm">Boost Hot (Paling Atas)</div>
              <div class="text-white/50 text-xs mt-1">Iklan Anda tampil paling atas dari semua iklan lainnya — visibilitas maksimal.</div>
            </div>
          </div>
        </div>

        <!-- Boost plans grouped by priority -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div
            v-for="plan in plans.boost"
            :key="plan.id"
            :class="[
              'relative rounded-2xl p-5 flex flex-col border transition-all duration-300 hover:-translate-y-1',
              plan.boost_priority === 1
                ? 'bg-gradient-to-br from-yellow-500/15 to-amber-600/15 border-yellow-400/40'
                : 'bg-white/8 border-white/15',
            ]"
          >
            <!-- Priority badge -->
            <div class="flex items-center gap-2 mb-4">
              <div :class="[
                'w-10 h-10 rounded-lg flex items-center justify-center',
                plan.boost_priority === 1
                  ? 'bg-gradient-to-br from-yellow-400 to-amber-500'
                  : 'bg-gradient-to-br from-blue-500 to-blue-700',
              ]">
                <i :class="`pi ${plan.boost_priority === 1 ? 'pi-star-fill' : 'pi-chart-line'} text-white`"></i>
              </div>
              <div>
                <span :class="[
                  'text-xs font-bold px-2 py-0.5 rounded-full',
                  plan.boost_priority === 1
                    ? 'bg-yellow-400/20 text-yellow-300'
                    : 'bg-blue-400/20 text-blue-300',
                ]">
                  {{ plan.boost_priority === 1 ? '⭐ HOT — Paling Atas' : '📈 Top-10 Harian' }}
                </span>
              </div>
            </div>

            <h3 class="text-lg font-bold text-white mb-1">{{ plan.display_name }}</h3>
            <p class="text-white/50 text-xs mb-3">Durasi: {{ plan.duration_days }} hari</p>
            <div class="text-2xl font-extrabold text-white mb-5 flex-1">{{ formatRupiah(plan.price_idr) }}</div>

            <p class="text-white/40 text-xs mb-4 italic">
              <i class="pi pi-info-circle mr-1"></i>
              Pilih job post target di halaman Jobs setelah membeli.
            </p>

            <button
              @click="push.info('Pilih job post yang ingin di-boost di halaman Jobs, lalu klik tombol Boost.')"
              class="w-full py-2.5 rounded-xl text-sm font-semibold border border-white/20 text-white/70 hover:bg-white/10 transition-all duration-200"
            >
              <i class="pi pi-arrow-right mr-1"></i> Boost via Halaman Jobs
            </button>
          </div>
        </div>

        <!-- Info note -->
        <div class="mt-8 text-center text-white/40 text-sm">
          <i class="pi pi-info-circle mr-1"></i>
          Untuk boost, buka halaman <router-link to="/recruiter/jobs" class="text-blue-400 hover:underline">Kelola Iklan</router-link> dan klik ikon <strong class="text-white/60">Boost</strong> pada iklan yang diinginkan.
        </div>
      </div>

      <!-- Bottom CTA -->
      <div class="mt-16 text-center">
        <router-link to="/recruiter/orders" class="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors">
          <i class="pi pi-history"></i>
          Lihat riwayat transaksi saya
        </router-link>
      </div>
    </div>
  </div>
</template>
