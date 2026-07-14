<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { push } from "notivue";
import { getAllPlans, createInvoice } from "@/services/payments.api.js";

const route  = useRoute();
const router = useRouter();

// ─── Query params ─────────────────────────────────────────────────────────────
const orderType  = route.query.type;          // subscription | single_post | boost
const planId     = Number(route.query.plan_id);
const jobPostId  = route.query.job_post_id || null; // only for boost

// ─── State ────────────────────────────────────────────────────────────────────
const plan          = ref(null);
const loading       = ref(true);
const step          = ref(1);           // 1 = detail, 2 = pilih metode
const invoiceLoading = ref(false);

// Payment method state
const selectedMethod = ref(null);       // 'qris' | 'va' | 'card'
const selectedBank   = ref(null);       // VA bank id
const card = ref({ name: "", number: "", expiry: "", cvv: "" });
const cardErrors = ref({});

// ─── Fetch plan ───────────────────────────────────────────────────────────────
onMounted(async () => {
  if (!orderType || !planId) {
    push.error("Parameter paket tidak valid");
    router.replace("/recruiter/pricing");
    return;
  }
  try {
    const res = await getAllPlans(orderType);
    let list = [];
    if (orderType === "subscription")  list = res?.data?.subscription || [];
    else if (orderType === "single_post") list = res?.data?.single_post || [];
    else if (orderType === "boost")    list = res?.data?.boost || [];
    plan.value = list.find((p) => p.id === planId) || null;
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

// ─── Pricing constants ────────────────────────────────────────────────────────
const PPN_RATE     = 0.11;   // 11 %
const QRIS_RATE    = 0.007;  // 0.7 % MDR QRIS (BI regulation)
const CARD_RATE    = 0.029;  // 2.9 % Xendit CC processing
const CARD_FIX_FEE = 2000;   // Rp 2.000 fixed

const VA_BANKS = [
  { id: "BCA",     name: "BCA",           fee: 4500 },
  { id: "BNI",     name: "BNI",           fee: 4000 },
  { id: "BRI",     name: "BRI",           fee: 4000 },
  { id: "MANDIRI", name: "Bank Mandiri",  fee: 4500 },
  { id: "PERMATA", name: "Permata Bank",  fee: 4500 },
  { id: "BSI",     name: "BSI",           fee: 4000 },
];

// ─── Price computed ───────────────────────────────────────────────────────────
const subtotal  = computed(() => Number(plan.value?.price_idr ?? 0));
const ppnAmount = computed(() => Math.round(subtotal.value * PPN_RATE));
const baseTotal = computed(() => subtotal.value + ppnAmount.value);

const methodFee = computed(() => {
  if (selectedMethod.value === "qris") {
    return Math.round(baseTotal.value * QRIS_RATE);
  }
  if (selectedMethod.value === "va" && selectedBank.value) {
    const bank = VA_BANKS.find((b) => b.id === selectedBank.value);
    return Number(bank?.fee ?? 0);
  }
  if (selectedMethod.value === "card") {
    return Math.round(baseTotal.value * CARD_RATE) + CARD_FIX_FEE;
  }
  return 0;
});

const grandTotal = computed(() => baseTotal.value + methodFee.value);

function formatRupiah(n) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(n));
}

// ─── Plan visual meta ─────────────────────────────────────────────────────────
const SUB_META = {
  starter:  { gradient: "from-blue-500 to-blue-700",    icon: "pi-bolt" },
  pro:      { gradient: "from-violet-500 to-violet-700", icon: "pi-crown" },
  business: { gradient: "from-amber-500 to-orange-600", icon: "pi-briefcase" },
  free:     { gradient: "from-slate-500 to-slate-600",  icon: "pi-gift" },
};

const planMeta = computed(() => {
  if (!plan.value) return { gradient: "from-slate-500 to-slate-600", icon: "pi-circle" };
  if (orderType === "single_post") {
    return plan.value.is_hot
      ? { gradient: "from-orange-500 to-red-600", icon: "pi-fire" }
      : { gradient: "from-blue-500 to-blue-700",  icon: "pi-file-edit" };
  }
  if (orderType === "boost") {
    return plan.value.boost_priority === 1
      ? { gradient: "from-yellow-400 to-amber-600", icon: "pi-star-fill" }
      : { gradient: "from-blue-500 to-blue-700",    icon: "pi-chart-line" };
  }
  return SUB_META[plan.value.name?.toLowerCase()] || SUB_META.starter;
});

const planFeatures = computed(() => {
  if (!plan.value) return [];
  if (orderType === "subscription") {
    return [
      `${plan.value.max_active_posts} iklan aktif bersamaan`,
      `Berlaku ${plan.value.duration_days} hari sejak aktivasi`,
      "Pembayaran aman via Xendit",
    ];
  }
  if (orderType === "single_post") {
    const f = ["1 slot iklan pekerjaan", `Berlaku ${plan.value.duration_days} hari sejak aktivasi`, "Tanpa perlu berlangganan"];
    if (plan.value.is_hot) f.push("Tampil sebagai iklan HOT 🔥");
    return f;
  }
  if (orderType === "boost") {
    const label = plan.value.boost_priority === 1 ? "Posisi paling atas dari semua iklan" : "Masuk 10 iklan teratas setiap hari";
    return [label, `Durasi ${plan.value.duration_days} hari`, "Aktif otomatis setelah pembayaran"];
  }
  return [];
});

const orderTypeLabel = computed(() => {
  if (orderType === "subscription")  return "Paket Langganan";
  if (orderType === "single_post")   return "Iklan Satuan";
  if (orderType === "boost") {
    return plan.value?.boost_priority === 1 ? "Boost HOT — Paling Atas" : "Boost Top-10 Harian";
  }
  return "Paket";
});

// ─── VA bank helpers ──────────────────────────────────────────────────────────
const selectedBankObj = computed(() => VA_BANKS.find((b) => b.id === selectedBank.value) || null);

// ─── Card input formatters ────────────────────────────────────────────────────
function onCardNumberInput(e) {
  const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
  card.value.number = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
}
function onExpiryInput(e) {
  let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
  if (raw.length > 2) raw = raw.slice(0, 2) + "/" + raw.slice(2);
  card.value.expiry = raw;
}
function onCvvInput(e) {
  card.value.cvv = e.target.value.replace(/\D/g, "").slice(0, 4);
}

function validateCard() {
  const errs = {};
  const num = card.value.number.replace(/\s/g, "");
  if (!card.value.name.trim())         errs.name   = "Nama pemegang kartu wajib diisi";
  if (num.length < 15)                 errs.number = "Nomor kartu tidak valid";
  if (!/^\d{2}\/\d{2}$/.test(card.value.expiry)) errs.expiry = "Format MM/YY tidak valid";
  if (card.value.cvv.length < 3)       errs.cvv    = "CVV minimal 3 digit";
  cardErrors.value = errs;
  return Object.keys(errs).length === 0;
}

// ─── Step navigation ──────────────────────────────────────────────────────────
function goToMethodSelect() {
  step.value = 2;
  selectedMethod.value = null;
  selectedBank.value   = null;
  card.value = { name: "", number: "", expiry: "", cvv: "" };
  cardErrors.value = {};
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function backToDetail() {
  step.value = 1;
}

// ─── Is pay button enabled? ───────────────────────────────────────────────────
const canPay = computed(() => {
  if (!selectedMethod.value) return false;
  if (selectedMethod.value === "va" && !selectedBank.value) return false;
  return true;
});

// ─── Create invoice ───────────────────────────────────────────────────────────
async function createBill() {
  if (selectedMethod.value === "card" && !validateCard()) return;
  if (!canPay.value || invoiceLoading.value) return;

  invoiceLoading.value = true;
  try {
    const payload = { order_type: orderType, plan_id: planId };
    if (orderType === "boost" && jobPostId) payload.job_post_id = jobPostId;

    const res = await createInvoice(payload);
    if (res?.data?.payment_url) {
      window.open(res.data.payment_url, "_blank");
      push.success("Tagihan berhasil dibuat! Selesaikan pembayaran di halaman Xendit.");
      router.push("/recruiter/orders");
    } else {
      push.error("Gagal membuat tagihan. Silakan coba lagi.");
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
        {{ step === 1 ? "Kembali ke Paket" : "Kembali ke Detail" }}
      </button>

      <!-- Step indicator -->
      <div class="flex items-center gap-2 mb-8">
        <template v-for="(label, i) in ['Detail Paket', 'Metode Pembayaran']" :key="i">
          <div class="flex items-center gap-2">
            <div :class="[
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
              step > i + 1  ? 'bg-green-500 text-white' :
              step === i + 1 ? 'bg-white text-slate-900 shadow-md' :
              'bg-white/10 text-white/40',
            ]">
              <i v-if="step > i + 1" class="pi pi-check text-xs"></i>
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span :class="['text-sm font-medium transition-colors', step === i + 1 ? 'text-white' : 'text-white/40']">
              {{ label }}
            </span>
          </div>
          <i v-if="i < 1" class="pi pi-chevron-right text-white/20 text-xs mx-1"></i>
        </template>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-24">
        <div class="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else-if="plan">

        <!-- ======================== STEP 1: DETAIL ======================== -->
        <div v-if="step === 1" class="space-y-5">

          <!-- Plan header card -->
          <div class="rounded-2xl overflow-hidden bg-white/8 border border-white/15">
            <div :class="`bg-gradient-to-r ${planMeta.gradient} p-6`">
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <i :class="`pi ${planMeta.icon} text-white text-2xl`"></i>
                </div>
                <div>
                  <div class="text-white/70 text-xs uppercase tracking-wider font-medium mb-1">{{ orderTypeLabel }}</div>
                  <h2 class="text-2xl font-extrabold text-white">{{ plan.display_name }}</h2>
                  <div v-if="orderType === 'boost' && jobPostId" class="text-white/60 text-xs mt-1 flex items-center gap-1">
                    <i class="pi pi-briefcase text-[10px]"></i> Untuk iklan yang dipilih
                  </div>
                </div>
              </div>
            </div>

            <!-- Features -->
            <div class="p-5">
              <ul class="space-y-3">
                <li v-for="f in planFeatures" :key="f" class="flex items-start gap-3 text-sm text-white/80">
                  <div class="w-7 h-7 bg-green-500/15 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i class="pi pi-check text-green-400 text-xs"></i>
                  </div>
                  <span>{{ f }}</span>
                </li>
                <li class="flex items-start gap-3 text-sm text-white/80">
                  <div class="w-7 h-7 bg-blue-500/15 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i class="pi pi-shield text-blue-400 text-xs"></i>
                  </div>
                  <span>Transaksi aman diproses oleh <strong class="text-white">Xendit</strong></span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Price breakdown -->
          <div class="bg-white/8 border border-white/15 rounded-2xl p-5">
            <h3 class="text-white font-semibold mb-4 flex items-center gap-2 text-sm">
              <i class="pi pi-receipt text-blue-400"></i> Rincian Harga
            </h3>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-white/60">Harga paket</span>
                <span class="text-white font-medium">{{ formatRupiah(subtotal) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-white/60">PPN ({{ (PPN_RATE * 100).toFixed(0) }}%)</span>
                <span class="text-white font-medium">{{ formatRupiah(ppnAmount) }}</span>
              </div>
              <div class="h-px bg-white/10"></div>
              <div class="flex justify-between items-center">
                <span class="text-white font-bold">Subtotal</span>
                <span class="text-white font-extrabold text-lg">{{ formatRupiah(baseTotal) }}</span>
              </div>
            </div>
            <p class="text-white/30 text-xs mt-4">
              <i class="pi pi-info-circle mr-1"></i>
              Biaya metode pembayaran akan ditampilkan di langkah berikutnya.
            </p>
          </div>

          <!-- Continue -->
          <button
            @click="goToMethodSelect"
            :class="`w-full py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r ${planMeta.gradient} hover:shadow-xl hover:scale-[1.01] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg`"
          >
            Lanjutkan <i class="pi pi-arrow-right"></i>
          </button>
        </div>

        <!-- ======================== STEP 2: METHOD ======================== -->
        <div v-else class="space-y-4">

          <!-- Order summary compact -->
          <div :class="`bg-gradient-to-r ${planMeta.gradient} rounded-2xl p-4 flex items-center justify-between`">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <i :class="`pi ${planMeta.icon} text-white`"></i>
              </div>
              <div>
                <div class="text-white/70 text-xs">{{ orderTypeLabel }}</div>
                <div class="text-white font-bold">{{ plan.display_name }}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-white/60 text-xs">Subtotal</div>
              <div class="text-white font-extrabold">{{ formatRupiah(baseTotal) }}</div>
            </div>
          </div>

          <!-- Payment methods -->
          <div class="bg-white/8 border border-white/15 rounded-2xl p-5">
            <h3 class="text-white font-semibold mb-4 text-sm flex items-center gap-2">
              <i class="pi pi-credit-card text-blue-400"></i> Pilih Metode Pembayaran
            </h3>

            <div class="space-y-3">

              <!-- ── QRIS ── -->
              <div
                @click="selectedMethod = 'qris'; selectedBank = null"
                :class="[
                  'rounded-xl border-2 cursor-pointer transition-all duration-200',
                  selectedMethod === 'qris' ? 'border-blue-400 bg-blue-400/8' : 'border-white/10 bg-white/5 hover:border-white/25',
                ]"
              >
                <!-- Method row -->
                <div class="flex items-center gap-3 p-4">
                  <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow">
                    <i class="pi pi-qrcode text-white text-sm"></i>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <span class="text-white font-semibold text-sm">QRIS</span>
                      <span class="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded">Instant</span>
                    </div>
                    <div class="text-white/50 text-xs mt-0.5">GoPay, OVO, Dana, ShopeePay, dll.</div>
                  </div>
                  <div :class="['w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all', selectedMethod === 'qris' ? 'border-blue-400 bg-blue-400' : 'border-white/30']">
                    <div v-if="selectedMethod === 'qris'" class="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <!-- QRIS fee breakdown (expanded) -->
                <Transition name="expand">
                  <div v-if="selectedMethod === 'qris'" class="border-t border-white/10 px-4 pb-4 pt-3">
                    <div class="bg-blue-500/10 rounded-xl p-4 space-y-2.5 text-sm">
                      <div class="flex justify-between text-white/70">
                        <span>Subtotal</span>
                        <span>{{ formatRupiah(baseTotal) }}</span>
                      </div>
                      <div class="flex justify-between text-white/70">
                        <span class="flex items-center gap-1">
                          Biaya QRIS
                          <span class="text-xs bg-white/10 px-1.5 py-0.5 rounded text-white/50">{{ (QRIS_RATE * 100).toFixed(1) }}% MDR</span>
                        </span>
                        <span class="text-yellow-300">+ {{ formatRupiah(methodFee) }}</span>
                      </div>
                      <div class="h-px bg-white/10"></div>
                      <div class="flex justify-between text-white font-bold">
                        <span>Total Bayar</span>
                        <span class="text-lg">{{ formatRupiah(grandTotal) }}</span>
                      </div>
                    </div>
                    <p class="text-white/30 text-xs mt-3">
                      <i class="pi pi-info-circle mr-1"></i>
                      Biaya MDR QRIS 0.7% sesuai regulasi Bank Indonesia untuk semua e-wallet dan scan QR.
                    </p>
                  </div>
                </Transition>
              </div>

              <!-- ── Virtual Account ── -->
              <div
                @click="selectedMethod = 'va'"
                :class="[
                  'rounded-xl border-2 cursor-pointer transition-all duration-200',
                  selectedMethod === 'va' ? 'border-green-400 bg-green-400/8' : 'border-white/10 bg-white/5 hover:border-white/25',
                ]"
              >
                <div class="flex items-center gap-3 p-4">
                  <div class="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow">
                    <i class="pi pi-building-columns text-white text-sm"></i>
                  </div>
                  <div class="flex-1">
                    <div class="text-white font-semibold text-sm">Transfer Virtual Account</div>
                    <div class="text-white/50 text-xs mt-0.5">BCA, BNI, BRI, Mandiri, Permata, BSI</div>
                  </div>
                  <div :class="['w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all', selectedMethod === 'va' ? 'border-green-400 bg-green-400' : 'border-white/30']">
                    <div v-if="selectedMethod === 'va'" class="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <!-- VA bank selection (expanded) -->
                <Transition name="expand">
                  <div v-if="selectedMethod === 'va'" class="border-t border-white/10 px-4 pb-4 pt-3">
                    <p class="text-white/60 text-xs mb-3">Pilih bank untuk generate Virtual Account:</p>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <button
                        v-for="bank in VA_BANKS"
                        :key="bank.id"
                        @click.stop="selectedBank = bank.id"
                        :class="[
                          'relative flex flex-col items-start p-3 rounded-xl border text-left transition-all duration-200',
                          selectedBank === bank.id
                            ? 'border-green-400 bg-green-500/15 shadow-md'
                            : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/8',
                        ]"
                      >
                        <div class="flex items-center justify-between w-full mb-1.5">
                          <span class="font-bold text-white text-xs">{{ bank.id }}</span>
                          <div :class="['w-4 h-4 rounded-full border-2 flex items-center justify-center', selectedBank === bank.id ? 'border-green-400 bg-green-400' : 'border-white/30']">
                            <div v-if="selectedBank === bank.id" class="w-1.5 h-1.5 bg-white rounded-full"></div>
                          </div>
                        </div>
                        <div class="text-white/50 text-[10px]">{{ bank.name }}</div>
                        <div class="text-yellow-300/80 text-[10px] mt-1">Admin: {{ formatRupiah(bank.fee) }}</div>
                      </button>
                    </div>

                    <!-- Fee breakdown after bank selected -->
                    <Transition name="expand">
                      <div v-if="selectedBankObj" class="mt-4 bg-green-500/10 rounded-xl p-4 space-y-2.5 text-sm">
                        <div class="flex justify-between text-white/70">
                          <span>Subtotal</span>
                          <span>{{ formatRupiah(baseTotal) }}</span>
                        </div>
                        <div class="flex justify-between text-white/70">
                          <span>Biaya admin {{ selectedBankObj.name }}</span>
                          <span class="text-yellow-300">+ {{ formatRupiah(selectedBankObj.fee) }}</span>
                        </div>
                        <div class="h-px bg-white/10"></div>
                        <div class="flex justify-between text-white font-bold">
                          <span>Total Bayar</span>
                          <span class="text-lg">{{ formatRupiah(grandTotal) }}</span>
                        </div>
                      </div>
                    </Transition>
                  </div>
                </Transition>
              </div>

              <!-- ── Kartu Kredit / Debit ── -->
              <div
                @click="selectedMethod = 'card'; selectedBank = null"
                :class="[
                  'rounded-xl border-2 transition-all duration-200',
                  selectedMethod === 'card' ? 'border-violet-400 bg-violet-400/8 cursor-default' : 'border-white/10 bg-white/5 hover:border-white/25 cursor-pointer',
                ]"
              >
                <div class="flex items-center gap-3 p-4">
                  <div class="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow">
                    <i class="pi pi-credit-card text-white text-sm"></i>
                  </div>
                  <div class="flex-1">
                    <div class="text-white font-semibold text-sm">Kartu Kredit / Debit</div>
                    <div class="text-white/50 text-xs mt-0.5">Visa, Mastercard, JCB</div>
                  </div>
                  <div :class="['w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all', selectedMethod === 'card' ? 'border-violet-400 bg-violet-400' : 'border-white/30']">
                    <div v-if="selectedMethod === 'card'" class="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <!-- Card form (expanded) -->
                <Transition name="expand">
                  <div v-if="selectedMethod === 'card'" class="border-t border-white/10 px-4 pb-5 pt-4" @click.stop>
                    <div class="space-y-3">
                      <!-- Name -->
                      <div>
                        <label class="text-white/60 text-xs mb-1.5 block">Nama Pemegang Kartu</label>
                        <input
                          v-model="card.name"
                          type="text"
                          placeholder="Sesuai yang tercetak di kartu"
                          class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 transition-all uppercase"
                          @input="cardErrors.name = ''"
                          style="text-transform: uppercase"
                        />
                        <p v-if="cardErrors.name" class="text-red-400 text-xs mt-1">{{ cardErrors.name }}</p>
                      </div>
                      <!-- Card number -->
                      <div>
                        <label class="text-white/60 text-xs mb-1.5 block">Nomor Kartu</label>
                        <div class="relative">
                          <input
                            :value="card.number"
                            @input="onCardNumberInput"
                            type="text"
                            inputmode="numeric"
                            placeholder="0000 0000 0000 0000"
                            maxlength="19"
                            class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white text-sm placeholder-white/30 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 tracking-widest transition-all"
                            @input.stop="cardErrors.number = ''"
                          />
                          <div class="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa" class="h-4 opacity-60" />
                          </div>
                        </div>
                        <p v-if="cardErrors.number" class="text-red-400 text-xs mt-1">{{ cardErrors.number }}</p>
                      </div>
                      <!-- Expiry + CVV -->
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="text-white/60 text-xs mb-1.5 block">Masa Berlaku</label>
                          <input
                            :value="card.expiry"
                            @input="onExpiryInput"
                            type="text"
                            inputmode="numeric"
                            placeholder="MM/YY"
                            maxlength="5"
                            class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 tracking-widest transition-all"
                            @input.stop="cardErrors.expiry = ''"
                          />
                          <p v-if="cardErrors.expiry" class="text-red-400 text-xs mt-1">{{ cardErrors.expiry }}</p>
                        </div>
                        <div>
                          <label class="text-white/60 text-xs mb-1.5 block flex items-center gap-1">
                            CVV / CVC
                            <span class="text-white/30 text-[10px]">(3–4 digit)</span>
                          </label>
                          <input
                            :value="card.cvv"
                            @input="onCvvInput"
                            type="password"
                            inputmode="numeric"
                            placeholder="•••"
                            maxlength="4"
                            class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 tracking-widest transition-all"
                            @input.stop="cardErrors.cvv = ''"
                          />
                          <p v-if="cardErrors.cvv" class="text-red-400 text-xs mt-1">{{ cardErrors.cvv }}</p>
                        </div>
                      </div>
                      <!-- Card fee breakdown -->
                      <div class="bg-violet-500/10 rounded-xl p-4 space-y-2.5 text-sm mt-1">
                        <div class="flex justify-between text-white/70">
                          <span>Subtotal</span>
                          <span>{{ formatRupiah(baseTotal) }}</span>
                        </div>
                        <div class="flex justify-between text-white/70">
                          <span class="flex items-center gap-1.5">
                            Biaya kartu kredit
                            <span class="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/50">{{ (CARD_RATE * 100).toFixed(1) }}% + Rp 2.000</span>
                          </span>
                          <span class="text-yellow-300">+ {{ formatRupiah(methodFee) }}</span>
                        </div>
                        <div class="h-px bg-white/10"></div>
                        <div class="flex justify-between text-white font-bold">
                          <span>Total Bayar</span>
                          <span class="text-lg">{{ formatRupiah(grandTotal) }}</span>
                        </div>
                      </div>
                      <p class="text-white/30 text-xs">
                        <i class="pi pi-lock mr-1"></i>
                        Detail kartu Anda diverifikasi di halaman pembayaran Xendit yang terenkripsi (PCI DSS).
                      </p>
                    </div>
                  </div>
                </Transition>
              </div>

            </div><!-- end payment methods -->
          </div>

          <!-- Grand total summary -->
          <div v-if="selectedMethod" class="bg-white/8 border border-white/15 rounded-2xl px-5 py-4 flex items-center justify-between">
            <span class="text-white/70 text-sm">Total yang dibayarkan</span>
            <span class="text-white font-extrabold text-xl transition-all duration-300">{{ formatRupiah(grandTotal) }}</span>
          </div>

          <!-- Pay button -->
          <button
            @click="createBill"
            :disabled="!canPay || invoiceLoading"
            :class="[
              'w-full py-4 rounded-2xl text-base font-bold transition-all duration-300 flex items-center justify-center gap-3 shadow-lg',
              canPay && !invoiceLoading
                ? `bg-gradient-to-r ${planMeta.gradient} text-white hover:shadow-2xl hover:scale-[1.01] active:scale-95`
                : 'bg-white/10 text-white/30 cursor-not-allowed',
            ]"
          >
            <span v-if="invoiceLoading" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <template v-else>
              <i class="pi pi-file-check text-lg"></i>
              <span>Buat Tagihan Pembayaran</span>
            </template>
          </button>
          <p class="text-center text-white/25 text-xs">
            <i class="pi pi-lock mr-1"></i>Transaksi diproses aman oleh Xendit · PCI DSS Compliant
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 600px;
}
</style>
