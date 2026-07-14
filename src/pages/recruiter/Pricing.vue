<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { push } from "notivue";
import { getAllPlans, getActivePlan } from "@/services/payments.api.js";

const router = useRouter();

const plans     = ref({ subscription: [], single_post: [], boost: [] });
const activePlan = ref(null);
const loading   = ref(true);
const activeTab = ref("subscription");

onMounted(async () => {
  try {
    const [plansRes, activePlanRes] = await Promise.all([
      getAllPlans(),
      getActivePlan().catch(() => null),
    ]);
    if (plansRes?.data)      plans.value     = plansRes.data;
    if (activePlanRes?.data) activePlan.value = activePlanRes.data;
  } catch {
    push.error("Gagal memuat data paket");
  } finally {
    loading.value = false;
  }
});

function formatRupiah(amount) {
  if (amount === 0) return "Gratis";
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(amount);
}

const currentPlanName = computed(() => activePlan.value?.subscription?.plan_name || "Free");
const currentMaxPosts = computed(() => activePlan.value?.max_active_posts || 1);
function isCurrentPlan(plan) {
  return activePlan.value?.subscription?.plan_name === plan.name;
}

function goToCheckout(orderType, plan) {
  router.push({ path: "/recruiter/checkout", query: { type: orderType, plan_id: plan.id } });
}

const subPlanMeta = {
  free:     { icon: "pi-gift",      gradient: "from-slate-400 to-slate-600", color: "slate",  badge: null,         features: ["1 iklan aktif", "Tanpa biaya", "Akses dasar"] },
  starter:  { icon: "pi-bolt",      gradient: "from-blue-500 to-blue-700",   color: "blue",   badge: "Populer",    features: ["5 iklan aktif", "Berlaku 30 hari", "Semua fitur standar"] },
  pro:      { icon: "pi-crown",     gradient: "from-violet-500 to-violet-700", color: "violet", badge: "Terbaik",  features: ["15 iklan aktif", "Berlaku 30 hari", "Prioritas dukungan"] },
  business: { icon: "pi-briefcase", gradient: "from-amber-500 to-orange-600", color: "amber",  badge: "Enterprise", features: ["25 iklan aktif", "Berlaku 30 hari", "Dukungan premium"] },
};
function getPlanMeta(planName) {
  return subPlanMeta[planName?.toLowerCase()] || subPlanMeta.starter;
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-10 px-4">
    <div class="max-w-6xl mx-auto">

      <!-- ── Header ─────────────────────────────────────────────────────────── -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-sm font-medium mb-5">
          <i class="pi pi-star-fill text-amber-400 text-xs"></i>
          Paket &amp; Harga
        </div>
        <h1 class="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3 leading-tight">
          Tingkatkan Rekrutmen
          <span class="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent"> Tanpa Batas</span>
        </h1>
        <p class="text-gray-500 max-w-lg mx-auto text-sm">
          Pilih paket yang sesuai kebutuhan bisnis Anda — dari gratis hingga enterprise.
        </p>

        <!-- Active plan badge -->
        <div v-if="!loading && activePlan" class="mt-5 inline-flex items-center gap-3 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm shadow-sm">
          <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span class="text-gray-700">Paket aktif: <strong class="text-green-600 capitalize">{{ currentPlanName }}</strong></span>
          <span class="text-gray-300">•</span>
          <span class="text-gray-500">{{ currentMaxPosts }} iklan maks.</span>
          <span class="text-gray-300">•</span>
          <span class="text-gray-500">{{ activePlan.single_post_slots || 0 }} slot satuan</span>
        </div>
      </div>

      <!-- ── Loading ────────────────────────────────────────────────────────── -->
      <div v-if="loading" class="flex justify-center py-24">
        <div class="flex flex-col items-center gap-3">
          <div class="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-gray-400 text-sm">Memuat paket...</p>
        </div>
      </div>

      <div v-else>
        <!-- ── Tabs ───────────────────────────────────────────────────────────── -->
        <div class="flex justify-center mb-8">
          <div class="inline-flex bg-white border border-gray-200 shadow-sm rounded-2xl p-1 gap-1">
            <button
              v-for="tab in [
                { key: 'subscription', label: 'Langganan',   icon: 'pi-calendar' },
                { key: 'single_post',  label: 'Iklan Satuan', icon: 'pi-file-edit' },
                { key: 'boost',        label: 'Boost Iklan',  icon: 'pi-chart-line' },
              ]"
              :key="tab.key"
              @click="activeTab = tab.key"
              :class="[
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100',
              ]"
            >
              <i :class="`pi ${tab.icon} text-xs`"></i>
              {{ tab.label }}
            </button>
          </div>
        </div>

        <!-- =================== SUBSCRIPTION =================== -->
        <div v-if="activeTab === 'subscription'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div
            v-for="plan in plans.subscription"
            :key="plan.id"
            :class="[
              'relative bg-white rounded-2xl flex flex-col transition-all duration-300 overflow-hidden',
              isCurrentPlan(plan)
                ? 'ring-2 ring-green-500 shadow-xl scale-[1.02]'
                : 'border border-gray-200 hover:shadow-lg hover:-translate-y-1',
            ]"
          >
            <!-- Colored top bar -->
            <div :class="`h-1.5 w-full bg-gradient-to-r ${getPlanMeta(plan.name).gradient}`"></div>

            <div class="p-6 flex flex-col flex-1">
              <!-- Badges -->
              <div class="flex items-start justify-between mb-4">
                <div :class="`w-11 h-11 rounded-xl bg-gradient-to-br ${getPlanMeta(plan.name).gradient} flex items-center justify-center shadow`">
                  <i :class="`pi ${getPlanMeta(plan.name).icon} text-white text-lg`"></i>
                </div>
                <div class="flex flex-col items-end gap-1">
                  <span
                    v-if="getPlanMeta(plan.name).badge"
                    class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100"
                  >{{ getPlanMeta(plan.name).badge }}</span>
                  <span
                    v-if="isCurrentPlan(plan)"
                    class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-600 border border-green-200"
                  ><i class="pi pi-check text-[10px] mr-1"></i>Aktif</span>
                </div>
              </div>

              <!-- Name & Price -->
              <h3 class="text-base font-bold text-gray-900 capitalize mb-1">{{ plan.display_name }}</h3>
              <div class="mb-4">
                <span class="text-2xl font-extrabold text-gray-900">{{ formatRupiah(plan.price_idr) }}</span>
                <span v-if="plan.price_idr > 0" class="text-gray-400 text-xs ml-1">/ {{ plan.duration_days }} hari</span>
              </div>

              <!-- Features -->
              <ul class="flex flex-col gap-2 mb-6 flex-1">
                <li v-for="f in getPlanMeta(plan.name).features" :key="f" class="flex items-center gap-2 text-sm text-gray-600">
                  <i class="pi pi-check-circle text-green-500 text-xs flex-shrink-0"></i>
                  {{ f }}
                </li>
                <li class="flex items-center gap-2 text-sm text-gray-600">
                  <i class="pi pi-check-circle text-green-500 text-xs flex-shrink-0"></i>
                  <strong class="text-gray-900">{{ plan.max_active_posts }} iklan</strong>&nbsp;aktif bersamaan
                </li>
              </ul>

              <!-- CTA -->
              <button
                v-if="plan.price_idr === 0"
                disabled
                class="w-full py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-400 cursor-not-allowed"
              >Paket Default</button>
              <button
                v-else-if="isCurrentPlan(plan)"
                disabled
                class="w-full py-2.5 rounded-xl text-sm font-semibold bg-green-50 text-green-600 cursor-not-allowed border border-green-200"
              ><i class="pi pi-check mr-1"></i>Paket Aktif</button>
              <button
                v-else
                @click="goToCheckout('subscription', plan)"
                :class="`w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${getPlanMeta(plan.name).gradient} hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2`"
              >
                <i class="pi pi-arrow-right text-xs"></i> Pilih Paket
              </button>
            </div>
          </div>
        </div>

        <!-- =================== SINGLE POST =================== -->
        <div v-if="activeTab === 'single_post'" class="max-w-3xl mx-auto">
          <p class="text-center text-gray-500 text-sm mb-7">Beli iklan satuan tanpa berlangganan. Cocok untuk kebutuhan rekrutmen sesekali.</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div
              v-for="plan in plans.single_post"
              :key="plan.id"
              :class="[
                'relative bg-white rounded-2xl border flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
                plan.is_hot ? 'border-orange-200' : 'border-gray-200',
              ]"
            >
              <!-- Top bar -->
              <div :class="`h-1.5 w-full ${plan.is_hot ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-blue-500 to-blue-700'}`"></div>

              <!-- HOT badge -->
              <div v-if="plan.is_hot" class="absolute top-4 right-4 px-2.5 py-0.5 bg-orange-100 text-orange-600 text-xs font-bold rounded-full border border-orange-200 flex items-center gap-1">
                <i class="pi pi-fire text-[10px]"></i> HOT
              </div>

              <div class="p-6 flex flex-col flex-1">
                <div :class="`w-11 h-11 rounded-xl flex items-center justify-center mb-4 shadow ${plan.is_hot ? 'bg-gradient-to-br from-orange-500 to-red-600' : 'bg-gradient-to-br from-blue-500 to-blue-700'}`">
                  <i :class="`pi ${plan.is_hot ? 'pi-fire' : 'pi-file-edit'} text-white text-lg`"></i>
                </div>
                <h3 class="text-base font-bold text-gray-900 mb-0.5">{{ plan.display_name }}</h3>
                <p class="text-gray-400 text-xs mb-3">Berlaku {{ plan.duration_days }} hari sejak aktivasi</p>
                <div class="text-2xl font-extrabold text-gray-900 mb-4">{{ formatRupiah(plan.price_idr) }}</div>

                <ul class="flex flex-col gap-2 mb-6 flex-1 text-sm text-gray-600">
                  <li class="flex items-center gap-2"><i class="pi pi-check-circle text-green-500 flex-shrink-0 text-xs"></i>1 slot iklan pekerjaan</li>
                  <li class="flex items-center gap-2"><i class="pi pi-check-circle text-green-500 flex-shrink-0 text-xs"></i>Tanpa perlu berlangganan</li>
                  <li v-if="plan.is_hot" class="flex items-center gap-2">
                    <i class="pi pi-check-circle text-orange-500 flex-shrink-0 text-xs"></i>
                    <span class="text-orange-600 font-semibold">Tampil sebagai iklan HOT 🔥</span>
                  </li>
                  <li v-else class="flex items-center gap-2"><i class="pi pi-check-circle text-blue-500 flex-shrink-0 text-xs"></i>Tampil sebagai iklan regular</li>
                </ul>

                <button
                  @click="goToCheckout('single_post', plan)"
                  :class="[
                    'w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg hover:scale-[1.02] active:scale-95',
                    plan.is_hot
                      ? 'bg-gradient-to-r from-orange-500 to-red-500'
                      : 'bg-gradient-to-r from-blue-500 to-blue-700',
                  ]"
                >
                  <i class="pi pi-arrow-right text-xs"></i> Lihat Detail &amp; Beli
                </button>
              </div>
            </div>
          </div>

          <!-- Existing slots -->
          <div v-if="activePlan?.available_single_posts?.length" class="mt-7 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 class="text-gray-800 font-semibold mb-4 flex items-center gap-2 text-sm">
              <i class="pi pi-wallet text-blue-500"></i> Slot Satuan Tersedia
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                v-for="slot in activePlan.available_single_posts"
                :key="slot.id"
                class="flex items-center justify-between bg-gray-50 rounded-xl p-3 border border-gray-100"
              >
                <div>
                  <div class="text-gray-800 text-sm font-medium">{{ slot.plan_display_name }}</div>
                  <div class="text-gray-400 text-xs mt-0.5">Kadaluarsa: {{ new Date(slot.expires_at).toLocaleDateString('id-ID') }}</div>
                </div>
                <span v-if="slot.is_hot" class="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold border border-orange-200">HOT</span>
              </div>
            </div>
            <p class="text-gray-400 text-xs mt-3">
              <i class="pi pi-info-circle mr-1"></i> Gunakan slot ini saat memposting lowongan via halaman Jobs.
            </p>
          </div>
        </div>

        <!-- =================== BOOST =================== -->
        <div v-if="activeTab === 'boost'" class="max-w-4xl mx-auto">
          <p class="text-center text-gray-500 text-sm mb-7">Tingkatkan visibilitas iklan Anda agar dilihat lebih banyak pencari kerja.</p>

          <!-- Info cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7">
            <div class="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div class="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <i class="pi pi-chart-line text-blue-600"></i>
              </div>
              <div>
                <div class="text-gray-800 font-semibold text-sm">Boost Top-10</div>
                <div class="text-gray-500 text-xs mt-1">Iklan Anda muncul di 10 posisi teratas setiap hari dalam durasi paket.</div>
              </div>
            </div>
            <div class="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
              <div class="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <i class="pi pi-star-fill text-amber-500"></i>
              </div>
              <div>
                <div class="text-gray-800 font-semibold text-sm">Boost Hot (Paling Atas)</div>
                <div class="text-gray-500 text-xs mt-1">Iklan Anda tampil paling atas dari semua iklan lainnya — visibilitas maksimal.</div>
              </div>
            </div>
          </div>

          <!-- Boost plan cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div
              v-for="plan in plans.boost"
              :key="plan.id"
              :class="[
                'bg-white rounded-2xl border flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
                plan.boost_priority === 1 ? 'border-amber-200' : 'border-gray-200',
              ]"
            >
              <!-- Top bar -->
              <div :class="`h-1.5 w-full ${plan.boost_priority === 1 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-blue-700'}`"></div>
              <div class="p-5 flex flex-col flex-1">
                <!-- Badge row -->
                <div class="flex items-center gap-2 mb-4">
                  <div :class="`w-9 h-9 rounded-lg flex items-center justify-center ${plan.boost_priority === 1 ? 'bg-amber-100' : 'bg-blue-100'}`">
                    <i :class="`pi ${plan.boost_priority === 1 ? 'pi-star-fill text-amber-500' : 'pi-chart-line text-blue-600'} text-sm`"></i>
                  </div>
                  <span :class="['text-xs font-bold px-2.5 py-0.5 rounded-full border', plan.boost_priority === 1 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-100']">
                    {{ plan.boost_priority === 1 ? '⭐ HOT — Paling Atas' : '📈 Top-10 Harian' }}
                  </span>
                </div>

                <h3 class="text-base font-bold text-gray-900 mb-0.5">{{ plan.display_name }}</h3>
                <p class="text-gray-400 text-xs mb-3">Durasi: {{ plan.duration_days }} hari</p>
                <div class="text-2xl font-extrabold text-gray-900 mb-4 flex-1">{{ formatRupiah(plan.price_idr) }}</div>

                <p class="text-gray-400 text-xs mb-4 italic">
                  <i class="pi pi-info-circle mr-1"></i>Pilih job post target di halaman Jobs.
                </p>

                <router-link
                  to="/recruiter/jobs"
                  :class="[
                    'w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-md hover:scale-[1.02] active:scale-95',
                    plan.boost_priority === 1
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                      : 'bg-gradient-to-r from-blue-500 to-blue-700',
                  ]"
                >
                  <i class="pi pi-briefcase text-xs"></i> Boost via Halaman Jobs
                </router-link>
              </div>
            </div>
          </div>

          <div class="mt-7 text-center text-gray-400 text-sm">
            <i class="pi pi-info-circle mr-1"></i>
            Buka halaman <router-link to="/recruiter/jobs" class="text-blue-600 hover:underline">Kelola Iklan</router-link> dan klik ikon <strong class="text-gray-600">Boost</strong> pada iklan yang diinginkan.
          </div>
        </div>

        <!-- Bottom CTA -->
        <div class="mt-14 text-center">
          <router-link to="/recruiter/orders" class="inline-flex items-center gap-2 text-gray-400 hover:text-gray-700 text-sm transition-colors">
            <i class="pi pi-history"></i> Lihat riwayat transaksi saya
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
