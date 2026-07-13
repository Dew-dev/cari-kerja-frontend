<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { push } from "notivue";
import { getAllPlans, createInvoice } from "@/services/payments.api.js";

const route = useRoute();
const router = useRouter();

// ─── State ───────────────────────────────────────────────────────────────────
const plan = ref(null);
const loading = ref(true);
const step = ref(1); // 1 = detail, 2 = pilih metode
const selectedMethod = ref(null);
const invoiceLoading = ref(false);

// query params: type, plan_id
const orderType = route.query.type;
const planId = Number(route.query.plan_id);

// ─── Fetch plan detail ────────────────────────────────────────────────────────
onMounted(async () => {
  if (!orderType || !planId) {
    push.error("Parameter paket tidak valid");
    router.replace("/recruiter/pricing");
    return;
  }
  try {
    const res = await getAllPlans(orderType);
    const list =
      orderType === "subscription"
        ? res?.data?.subscription
        : res?.data?.single_post;
    plan.value = (list || []).find((p) => p.id === planId) || null;
    if (!plan.value) {
      push.error("Paket tidak ditemukan");
      router.replace("/recruiter/pricing");
    }
  } catch {
    push.error("Gagal memuat detail paket");
    router.replace("/recruiter/pricing");
  } finally {
    loading.value = false;
  }
});

// ─── Tax & Price ──────────────────────────────────────────────────────────────
const PPN_RATE = 0.11;
const subtotal = computed(() => plan.value?.price_idr || 0);
const ppn = computed(() => Math.round(subtotal.value * PPN_RATE));
const total = computed(() => subtotal.value + ppn.value);

function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

// ─── Plan meta ────────────────────────────────────────────────────────────────
const planGradient = computed(() => {
  if (orderType === "single_post") {
    return plan.value?.is_hot
      ? "from-orange-500 to-red-600"
      : "from-blue-500 to-blue-700";
  }
  const g = {
    starter: "from-blue-500 to-blue-700",
    pro: "from-violet-500 to-violet-700",
    business: "from-amber-500 to-orange-600",
  };
  return g[plan.value?.name?.toLowerCase()] || "from-slate-500 to-slate-600";
});

const planIcon = computed(() => {
  if (orderType === "single_post") return plan.value?.is_hot ? "pi-fire" : "pi-file-edit";
  const i = { starter: "pi-bolt", pro: "pi-crown", business: "pi-briefcase" };
  return i[plan.value?.name?.toLowerCase()] || "pi-gift";
});

// ─── Payment Methods ──────────────────────────────────────────────────────────
const paymentMethods = [
  {
    id: "qris",
    label: "QRIS",
    description: "GoPay, OVO, Dana, ShopeePay, dll.",
    icon: "pi-qrcode",
    color: "from-blue-500 to-cyan-500",
    badge: "Instant",
  },
  {
    id: "va",
    label: "Virtual Account",
    description: "BCA, BNI, BRI, Mandiri, Permata",
    icon: "pi-building-columns",
    color: "from-green-500 to-emerald-600",
    badge: null,
  },
  {
    id: "ewallet",
    label: "E-Wallet",
    description: "GoPay, OVO, Dana, LinkAja",
    icon: "pi-wallet",
    color: "from-violet-500 to-purple-600",
    badge: "Instant",
  },
  {
    id: "card",
    label: "Kartu Kredit / Debit",
    description: "Visa, Mastercard, JCB",
    icon: "pi-credit-card",
    color: "from-slate-500 to-slate-700",
    badge: null,
  },
];

// ─── Actions ─────────────────────────────────────────────────────────────────
function goToMethodSelect() {
  step.value = 2;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function backToDetail() {
  step.value = 1;
  selectedMethod.value = null;
}

async function createBill() {
  if (!selectedMethod.value) {
    push.warning("Pilih metode pembayaran terlebih dahulu");
    return;
  }
  invoiceLoading.value = true;
  try {
    const res = await createInvoice({
      order_type: orderType,
      plan_id: planId,
    });
    if (res?.data?.payment_url) {
      window.open(res.data.payment_url, "_blank");
      push.success("Tagihan berhasil dibuat! Selesaikan pembayaran di tab baru.");
      // Navigate to orders so user can track
      router.push("/recruiter/orders");
    } else {
      push.error("Gagal membuat tagihan. Coba lagi.");
    }
  } catch (err) {
    const msg = err?.response?.data?.message || "Gagal membuat tagihan pembayaran";
    push.error(msg);
  } finally {
    invoiceLoading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 py-10 px-4">
    <div class="max-w-2xl mx-auto">

      <!-- Back button -->
      <button
        @click="step === 1 ? router.back() : backToDetail()"
        class="flex items-center gap-2 text-white/50 hover:text-white text-sm mb-8 transition-colors group"
      >
        <i class="pi pi-arrow-left text-xs group-hover:-translate-x-1 transition-transform"></i>
        {{ step === 1 ? 'Kembali ke Paket' : 'Kembali ke Detail' }}
      </button>

      <!-- Step indicator -->
      <div class="flex items-center gap-3 mb-8">
        <div v-for="(s, i) in ['Detail Paket', 'Metode Pembayaran']" :key="i"
          class="flex items-center gap-2">
          <div :class="[
            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
            step > i + 1 ? 'bg-green-500 text-white' :
            step === i + 1 ? 'bg-white text-slate-900' :
            'bg-white/10 text-white/40'
          ]">
            <i v-if="step > i + 1" class="pi pi-check text-xs"></i>
            <span v-else>{{ i + 1 }}</span>
          </div>
          <span :class="['text-sm font-medium', step === i + 1 ? 'text-white' : 'text-white/40']">
            {{ s }}
          </span>
          <i v-if="i < 1" class="pi pi-chevron-right text-white/20 text-xs mx-1"></i>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-24">
        <div class="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else-if="plan">

        <!-- =================== STEP 1: PLAN DETAIL =================== -->
        <div v-if="step === 1">

          <!-- Plan Card -->
          <div class="bg-white/8 backdrop-blur border border-white/15 rounded-2xl overflow-hidden mb-6">
            <!-- Header gradient -->
            <div :class="`bg-gradient-to-r ${planGradient} p-6`">
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <i :class="`pi ${planIcon} text-white text-2xl`"></i>
                </div>
                <div>
                  <div class="text-white/70 text-xs uppercase tracking-wider font-medium mb-1">
                    {{ orderType === 'subscription' ? 'Paket Langganan' : 'Iklan Satuan' }}
                  </div>
                  <h2 class="text-2xl font-extrabold text-white">{{ plan.display_name }}</h2>
                </div>
              </div>
            </div>

            <!-- Plan Details -->
            <div class="p-6">
              <ul class="space-y-3 mb-0">
                <li v-if="orderType === 'subscription'" class="flex items-center gap-3 text-sm text-white/80">
                  <div class="w-8 h-8 bg-green-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i class="pi pi-check text-green-400 text-xs"></i>
                  </div>
                  <span><strong class="text-white">{{ plan.max_active_posts }} iklan</strong> aktif bersamaan</span>
                </li>
                <li v-if="orderType === 'single_post'" class="flex items-center gap-3 text-sm text-white/80">
                  <div class="w-8 h-8 bg-green-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i class="pi pi-check text-green-400 text-xs"></i>
                  </div>
                  <span>1 slot iklan pekerjaan</span>
                </li>
                <li v-if="orderType === 'single_post' && plan.is_hot" class="flex items-center gap-3 text-sm text-white/80">
                  <div class="w-8 h-8 bg-orange-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i class="pi pi-fire text-orange-400 text-xs"></i>
                  </div>
                  <span class="text-orange-300 font-semibold">Tampil sebagai iklan HOT 🔥</span>
                </li>
                <li class="flex items-center gap-3 text-sm text-white/80">
                  <div class="w-8 h-8 bg-blue-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i class="pi pi-calendar text-blue-400 text-xs"></i>
                  </div>
                  <span>Berlaku <strong class="text-white">{{ plan.duration_days }} hari</strong> sejak aktivasi</span>
                </li>
                <li class="flex items-center gap-3 text-sm text-white/80">
                  <div class="w-8 h-8 bg-violet-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i class="pi pi-shield text-violet-400 text-xs"></i>
                  </div>
                  <span>Pembayaran aman via Xendit</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Price Breakdown -->
          <div class="bg-white/8 backdrop-blur border border-white/15 rounded-2xl p-6 mb-6">
            <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
              <i class="pi pi-receipt text-blue-400"></i>
              Rincian Harga
            </h3>
            <div class="space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-white/60">Harga paket</span>
                <span class="text-white font-medium">{{ formatRupiah(subtotal) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-white/60">PPN (11%)</span>
                <span class="text-white font-medium">{{ formatRupiah(ppn) }}</span>
              </div>
              <div class="h-px bg-white/10 my-1"></div>
              <div class="flex justify-between">
                <span class="text-white font-bold text-base">Total Pembayaran</span>
                <span class="text-white font-extrabold text-xl">{{ formatRupiah(total) }}</span>
              </div>
            </div>
            <p class="text-white/30 text-xs mt-4">
              <i class="pi pi-info-circle mr-1"></i>
              Harga sudah termasuk PPN 11% sesuai peraturan perpajakan Indonesia.
            </p>
          </div>

          <!-- Continue Button -->
          <button
            @click="goToMethodSelect"
            :class="`w-full py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r ${planGradient} hover:shadow-xl hover:scale-[1.01] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg`"
          >
            <span>Lanjutkan</span>
            <i class="pi pi-arrow-right"></i>
          </button>
        </div>

        <!-- =================== STEP 2: PAYMENT METHOD =================== -->
        <div v-else>

          <!-- Order Summary (compact) -->
          <div :class="`bg-gradient-to-r ${planGradient} rounded-2xl p-4 mb-6 flex items-center justify-between`">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <i :class="`pi ${planIcon} text-white`"></i>
              </div>
              <div>
                <div class="text-white/70 text-xs">Paket dipilih</div>
                <div class="text-white font-bold">{{ plan.display_name }}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-white/70 text-xs">Total</div>
              <div class="text-white font-extrabold text-lg">{{ formatRupiah(total) }}</div>
            </div>
          </div>

          <!-- Payment Methods -->
          <div class="bg-white/8 backdrop-blur border border-white/15 rounded-2xl p-6 mb-6">
            <h3 class="text-white font-semibold mb-5 flex items-center gap-2">
              <i class="pi pi-credit-card text-blue-400"></i>
              Pilih Metode Pembayaran
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                v-for="method in paymentMethods"
                :key="method.id"
                @click="selectedMethod = method.id"
                :class="[
                  'relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200',
                  selectedMethod === method.id
                    ? 'border-blue-400 bg-blue-400/10 shadow-lg shadow-blue-500/20'
                    : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/8',
                ]"
              >
                <!-- Icon -->
                <div :class="`w-10 h-10 bg-gradient-to-br ${method.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow`">
                  <i :class="`pi ${method.icon} text-white text-sm`"></i>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-white font-semibold text-sm">{{ method.label }}</span>
                    <span v-if="method.badge" class="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded">
                      {{ method.badge }}
                    </span>
                  </div>
                  <div class="text-white/50 text-xs mt-0.5 truncate">{{ method.description }}</div>
                </div>

                <!-- Radio -->
                <div :class="[
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                  selectedMethod === method.id ? 'border-blue-400 bg-blue-400' : 'border-white/30',
                ]">
                  <div v-if="selectedMethod === method.id" class="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
            </div>

            <p class="text-white/30 text-xs mt-4 text-center">
              <i class="pi pi-info-circle mr-1"></i>
              Xendit akan menampilkan semua opsi metode pembayaran yang tersedia setelah tagihan dibuat.
            </p>
          </div>

          <!-- Create Bill Button -->
          <button
            @click="createBill"
            :disabled="!selectedMethod || invoiceLoading"
            :class="[
              'w-full py-4 rounded-2xl text-base font-bold transition-all duration-300 flex items-center justify-center gap-3 shadow-lg',
              selectedMethod && !invoiceLoading
                ? `bg-gradient-to-r ${planGradient} text-white hover:shadow-xl hover:scale-[1.01] active:scale-95`
                : 'bg-white/10 text-white/30 cursor-not-allowed',
            ]"
          >
            <span v-if="invoiceLoading" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <template v-else>
              <i class="pi pi-file-check text-lg"></i>
              <span>Buat Tagihan Pembayaran</span>
            </template>
          </button>

          <p class="text-center text-white/30 text-xs mt-4">
            <i class="pi pi-lock mr-1"></i>
            Transaksi diproses aman oleh Xendit — PCI DSS Compliant
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
