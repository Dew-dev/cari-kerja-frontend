<template>
  <header class="bg-[#0a9cf5] text-white shrink-0">
    <div
      class="max-w-290 mx-auto px-4 sm:px-6 md:px-8 py-3 md:py-6 flex items-center justify-between gap-3"
    >
      <div
        class="text-lg md:text-xl font-bold hover:cursor-pointer hover:scale-105 transition duration-200 ease-in-out shrink-0"
        @click="router.push('/')"
      >
        <span
          :class="
            route.path === '/'
              ? 'text-red-500'
              : 'text-white hover:text-pink-500'
          "
          >CARI </span
        >
        <span
          :class="
            route.path === '/'
              ? 'text-white hover:text-pink-500'
              : 'text-red-500'
          "
          >KERJA</span
        >
      </div>

      <div class="hidden md:block flex-1 min-w-0">
        <RecruiterHeader v-if="auth.role === 'recruiter'" />
        <UserHeader v-else />
      </div>

      <nav class="hidden md:flex items-center gap-4 text-sm relative shrink-0">
        <div class="relative" @click.stop>
          <button
            @click="open = !open; accountOpen = false"
            class="flex items-center gap-1 border border-white shadow-sm px-4 py-3 rounded font-semibold hover:bg-white hover:text-blue-500 transition duration-200"
            aria-haspopup="true"
            :aria-expanded="open"
          >
            {{ locale.toUpperCase() }}
            <span>▾</span>
          </button>

          <div
            v-if="open"
            class="absolute right-0 mt-1 bg-white text-gray-800 shadow-lg min-w-[140px] z-50 font-semibold rounded-md"
          >
            <button
              v-for="lang in languages"
              :key="lang.code"
              @click="setLang(lang.code)"
              class="w-full text-left px-3 py-2 hover:bg-gray-100"
            >
              {{ lang.label }}
            </button>
          </div>
        </div>

        <template v-if="!auth.isLoggedIn">
          <button
            class="border border-white shadow-sm px-4 py-3 rounded font-semibold hover:bg-white hover:text-blue-500 transition duration-200"
            @click="router.push('/login')"
          >
            {{ $t("nav.signIn") }}
          </button>
        </template>

        <template v-else>
          <div class="relative" @click.stop>
            <button
              type="button"
              class="flex items-center gap-2 cursor-pointer rounded-lg px-1.5 py-1 hover:bg-white/10 transition"
              @click="accountOpen = !accountOpen; open = false"
            >
              <div class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                <img
                  v-if="auth.user?.avatar_url"
                  :src="`${fileStorageUrl}${auth.user?.avatar_url}`"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-sm font-semibold text-gray-700">
                  {{ (auth.user?.name || auth.user?.email || "?").charAt(0)?.toUpperCase() }}
                </span>
              </div>
              <span class="text-sm max-w-[120px] truncate">{{ auth.user?.name || auth.user?.email || "" }}</span>
              <span class="text-xs opacity-80">▾</span>
            </button>

            <div
              v-if="accountOpen"
              class="absolute right-0 mt-2 w-56 rounded-xl bg-white text-slate-800 shadow-xl border border-slate-100 z-50 py-1.5 overflow-hidden"
            >
              <template v-if="auth.role === 'recruiter'">
                <button
                  v-for="item in recruiterAccountLinks"
                  :key="item.path"
                  type="button"
                  class="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
                  :class="isAccountActive(item.path) ? 'text-blue-600 bg-blue-50/70' : 'text-slate-800'"
                  @click="goAccount(item.path)"
                >
                  {{ item.label }}
                </button>
                <div class="my-1 h-px bg-slate-100" />
              </template>
              <button
                v-else
                type="button"
                class="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
                @click="goAccount('/profile/edit')"
              >
                {{ $t("Profile") }}
              </button>
              <button
                type="button"
                class="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                @click="logout"
              >
                {{ $t("nav.logout") || "Logout" }}
              </button>
            </div>
          </div>
        </template>
      </nav>

      <div class="md:hidden flex items-center gap-2">
        <button
          @click="mobileOpen = !mobileOpen"
          class="p-2 rounded-md border border-white hover:bg-white hover:text-blue-500 transition"
          aria-label="Toggle menu"
          :aria-expanded="mobileOpen"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              v-if="!mobileOpen"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
            <path
              v-else
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>

    <div
      v-if="mobileOpen"
      class="md:hidden bg-[#0890e0] text-white border-t border-blue-400/60"
    >
      <div class="max-w-290 mx-auto px-4 py-4 space-y-4">
        <div>
          <div class="text-[11px] uppercase tracking-wide text-white/70 font-semibold mb-2 px-1">
            {{ $t("nav.menu") || "Menu" }}
          </div>
          <RecruiterHeader
            v-if="auth.role === 'recruiter'"
            mobile
            @navigate="closeMobile"
          />
          <UserHeader
            v-else
            mobile
            @navigate="closeMobile"
          />
        </div>

        <template v-if="auth.role === 'recruiter'">
          <div class="h-px bg-white/20" />
          <div>
            <div class="text-[11px] uppercase tracking-wide text-white/70 font-semibold mb-2 px-1">
              {{ $t("companySettings.navAccount") || "Account" }}
            </div>
            <div class="flex flex-col gap-1">
              <button
                v-for="item in recruiterAccountLinks"
                :key="'m-' + item.path"
                type="button"
                class="flex items-center gap-3 px-3 py-3 rounded-xl font-semibold text-left"
                :class="
                  isAccountActive(item.path)
                    ? 'bg-white text-[#0a9cf5] shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                "
                @click="goAccount(item.path); closeMobile()"
              >
                {{ item.label }}
              </button>
            </div>
          </div>
        </template>

        <div class="h-px bg-white/20" />

        <div>
          <div class="text-[11px] uppercase tracking-wide text-white/70 font-semibold mb-2 px-1">
            {{ $t("nav.language") || "Language" }}
          </div>
          <div class="flex gap-2">
            <button
              v-for="lang in languages"
              :key="lang.code + '-m'"
              @click="setLang(lang.code)"
              class="flex-1 text-sm px-3 py-2.5 rounded-xl font-medium transition"
              :class="
                locale === lang.code
                  ? 'bg-white text-[#0a9cf5]'
                  : 'bg-white/10 hover:bg-white/20'
              "
            >
              {{ lang.label }}
            </button>
          </div>
        </div>

        <div class="h-px bg-white/20" />

        <div>
          <template v-if="!auth.isLoggedIn">
            <button
              class="w-full text-left px-3 py-3 rounded-xl bg-white text-[#0a9cf5] hover:bg-blue-50 font-semibold"
              @click="router.push('/login'); closeMobile()"
            >
              {{ $t("nav.signIn") }}
            </button>
          </template>

          <template v-else>
            <div class="flex items-center gap-3 px-1">
              <div class="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                <img
                  v-if="auth.user?.avatar_url"
                  :src="`${fileStorageUrl}${auth.user?.avatar_url}`"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-sm font-semibold text-gray-700">
                  {{ (auth.user?.name || auth.user?.email || "?").charAt(0)?.toUpperCase() }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold truncate">{{ auth.user?.name || auth.user?.email || "" }}</div>
                <button
                  class="mt-2 text-sm px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 font-semibold"
                  @click="logout"
                >
                  {{ $t("nav.logout") || "Logout" }}
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import RecruiterHeader from "@/components/layout/RecruiterHeader.vue";
import UserHeader from "@/components/layout/UserHeader.vue";
import { useAuthStore } from "@/stores/authStore.js";

const { locale, t } = useI18n();
const open = ref(false);
const accountOpen = ref(false);
const mobileOpen = ref(false);

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const fileStorageUrl = import.meta.env.VITE_FILE_STORAGE_URL;

const recruiterAccountLinks = computed(() => {
  const links = [
    {
      label: t("companySettings.navCompany"),
      path: "/recruiter/company",
    },
    {
      label: t("companyTeam.nav"),
      path: "/recruiter/company/team",
    },
    {
      label: t("companySettings.navPersonal"),
      path: "/recruiter/profile",
    },
  ];
  if (auth.canManageBilling) {
    links.push({
      label: t("payment.navOrders") || t("payment.history") || "Orders",
      path: "/recruiter/orders",
    });
  }
  return links;
});

function isAccountActive(path) {
  if (path === "/recruiter/company") {
    return route.path === "/recruiter/company";
  }
  return route.path === path || route.path.startsWith(`${path}/`);
}

function closeMobile() {
  mobileOpen.value = false;
  open.value = false;
  accountOpen.value = false;
}

function logout() {
  auth.logout();
  closeMobile();
  router.push("/");
}

function goAccount(path) {
  accountOpen.value = false;
  router.push(path);
}

const languages = [
  { code: "en", label: "English" },
  { code: "id", label: "Indonesia" },
];

function setLang(lang) {
  locale.value = lang;
  localStorage.setItem("lang", lang);
  closeMobile();
}

function onDocClick(e) {
  if (!accountOpen.value && !open.value) return;
  const header = e.target?.closest?.("header");
  if (!header) {
    accountOpen.value = false;
    open.value = false;
  }
}

onMounted(() => document.addEventListener("click", onDocClick));
onBeforeUnmount(() => document.removeEventListener("click", onDocClick));
</script>
