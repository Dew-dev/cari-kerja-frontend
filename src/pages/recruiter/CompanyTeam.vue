<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import { useAuthStore } from "@/stores/authStore.js";
import {
  getCompanyMembers,
  updateCompanyMemberRole,
  removeCompanyMember,
  transferCompanyOwnership,
  getCompanyInvitations,
  createCompanyInvitation,
  resendCompanyInvitation,
  revokeCompanyInvitation,
} from "@/services/companies.api.js";
import { canAssignRole, COMPANY_ROLES } from "@/utils/companyPermissions";
import SkeletonTable from "@/components/common/skeleton/SkeletonTable.vue";

const auth = useAuthStore();
const { t } = useI18n();

const members = ref([]);
const invitations = ref([]);
const loading = ref(false);
const inviting = ref(false);
const transferring = ref(false);
const transferUserId = ref("");
const invite = reactive({ email: "", role: "recruiter" });

const canManage = computed(() => auth.canManageTeam);
const isOwner = computed(() => auth.isCompanyOwner);
const actorRole = computed(() => auth.companyRole);

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 min-h-11 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600";
const labelClass = "block text-sm font-medium text-slate-800 mb-1.5";

function errMsg(err, fallback) {
  return err?.response?.data?.message || fallback;
}

function memberName(m) {
  return m.contact_name || m.name || m.username || m.email || `#${m.user_id}`;
}

function assignableRoles(member) {
  return [COMPANY_ROLES.ADMIN, COMPANY_ROLES.RECRUITER].filter((role) =>
    canAssignRole(actorRole.value, role),
  );
}

async function loadAll() {
  loading.value = true;
  try {
    const [mem, inv] = await Promise.allSettled([
      getCompanyMembers(),
      getCompanyInvitations(),
    ]);
    if (mem.status === "fulfilled") {
      members.value = Array.isArray(mem.value) ? mem.value : mem.value?.members || [];
    } else {
      push.error(errMsg(mem.reason, "Failed to load members"));
      members.value = [];
    }
    if (inv.status === "fulfilled") {
      invitations.value = Array.isArray(inv.value)
        ? inv.value
        : inv.value?.invitations || [];
    } else if (canManage.value) {
      invitations.value = [];
    }
  } finally {
    loading.value = false;
  }
}

async function onRoleChange(member, role) {
  if (!canManage.value || !canAssignRole(actorRole.value, role)) return;
  try {
    await updateCompanyMemberRole(member.user_id, role);
    member.role = role;
    push.success(t("companyTeam.roleUpdated") || "Role updated");
  } catch (err) {
    push.error(errMsg(err, "Failed to update role"));
    await loadAll();
  }
}

async function onRemove(member) {
  if (!canManage.value) return;
  if (!confirm(t("companyTeam.confirmRemove") || `Remove ${memberName(member)}?`)) return;
  try {
    await removeCompanyMember(member.user_id);
    members.value = members.value.filter((m) => m.user_id !== member.user_id);
    push.success(t("companyTeam.removed") || "Member removed");
  } catch (err) {
    push.error(errMsg(err, "Failed to remove member"));
  }
}

async function onTransfer() {
  if (!isOwner.value || !transferUserId.value) return;
  if (!confirm(t("companyTeam.confirmTransfer") || "Transfer ownership? This cannot be undone easily.")) return;
  transferring.value = true;
  try {
    await transferCompanyOwnership(Number(transferUserId.value));
    push.success(t("companyTeam.transferred") || "Ownership transferred");
    await auth.refreshSession({ logoutOnFail: false });
    await loadAll();
  } catch (err) {
    push.error(errMsg(err, "Failed to transfer ownership"));
  } finally {
    transferring.value = false;
  }
}

async function onInvite() {
  if (!canManage.value) return;
  inviting.value = true;
  try {
    await createCompanyInvitation({ email: invite.email.trim(), role: invite.role });
    push.success(t("companyTeam.inviteSent") || "Invitation sent");
    invite.email = "";
    invite.role = "recruiter";
    await loadAll();
  } catch (err) {
    push.error(errMsg(err, "Failed to send invitation"));
  } finally {
    inviting.value = false;
  }
}

async function onResend(inv) {
  try {
    await resendCompanyInvitation(inv.id);
    push.success(t("companyTeam.resent") || "Invitation resent");
  } catch (err) {
    push.error(errMsg(err, "Failed to resend"));
  }
}

async function onRevoke(inv) {
  try {
    await revokeCompanyInvitation(inv.id);
    invitations.value = invitations.value.filter((i) => i.id !== inv.id);
    push.success(t("companyTeam.revoked") || "Invitation revoked");
  } catch (err) {
    push.error(errMsg(err, "Failed to revoke"));
  }
}

const pendingInvites = computed(() =>
  invitations.value.filter((i) => !i.accepted_at && i.status !== "accepted" && i.status !== "revoked"),
);

const transferCandidates = computed(() =>
  members.value.filter(
    (m) => m.user_id !== auth.user?.user_id && normalizeRole(m) !== COMPANY_ROLES.OWNER,
  ),
);

function normalizeRole(m) {
  return String(m.role || m.company_role || "").toLowerCase();
}

onMounted(loadAll);
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div class="mb-8">
        <h1 class="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
          {{ t("companyTeam.title") || "Company team" }}
        </h1>
        <p class="mt-2 text-sm text-slate-500">
          {{ t("companyTeam.subtitle") || "Members and invitations" }}
        </p>
        <p
          v-if="!canManage"
          class="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2"
        >
          {{ t("companyTeam.readOnly") || "You can view the team but only admins can manage it." }}
        </p>
        <RouterLink to="/recruiter/company" class="inline-block mt-4 text-sm font-medium text-blue-600 hover:underline">
          {{ t("companyTeam.backToCompany") || "← Company settings" }}
        </RouterLink>
      </div>

      <SkeletonTable v-if="loading" :rows="5" :columns="4" />

      <div v-else class="space-y-6">
        <!-- Members -->
        <section class="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6 overflow-x-auto">
          <h2 class="text-base font-semibold text-slate-900 mb-4">{{ t("companyTeam.members") || "Members" }}</h2>
          <p v-if="!members.length" class="text-sm text-slate-500 py-6 text-center">
            {{ t("companyTeam.noMembers") || "No members found." }}
          </p>
          <table v-else class="w-full text-sm text-left">
            <thead class="text-slate-500 border-b border-slate-100">
              <tr>
                <th class="py-2 pr-3 font-medium">{{ t("companyTeam.colName") || "Name" }}</th>
                <th class="py-2 pr-3 font-medium">{{ t("companyTeam.colEmail") || "Email" }}</th>
                <th class="py-2 pr-3 font-medium">{{ t("companyTeam.colRole") || "Role" }}</th>
                <th v-if="canManage" class="py-2 font-medium">{{ t("companyTeam.colActions") || "Actions" }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in members" :key="m.user_id" class="border-b border-slate-50">
                <td class="py-3 pr-3 text-slate-900 font-medium">{{ memberName(m) }}</td>
                <td class="py-3 pr-3 text-slate-600">{{ m.email || "—" }}</td>
                <td class="py-3 pr-3">
                  <select
                    v-if="canManage && normalizeRole(m) !== 'owner' && assignableRoles(m).length"
                    :value="normalizeRole(m)"
                    class="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    @change="onRoleChange(m, $event.target.value)"
                  >
                    <option v-for="r in assignableRoles(m)" :key="r" :value="r">{{ r }}</option>
                    <option v-if="!assignableRoles(m).includes(normalizeRole(m))" :value="normalizeRole(m)">
                      {{ normalizeRole(m) }}
                    </option>
                  </select>
                  <span v-else class="capitalize text-slate-700">{{ normalizeRole(m) || "—" }}</span>
                </td>
                <td v-if="canManage" class="py-3">
                  <button
                    v-if="normalizeRole(m) !== 'owner'"
                    type="button"
                    class="text-red-600 hover:underline text-sm"
                    @click="onRemove(m)"
                  >{{ t("companyTeam.remove") || "Remove" }}</button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- Invite -->
        <section v-if="canManage" class="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
          <h2 class="text-base font-semibold text-slate-900 mb-4">{{ t("companyTeam.invite") || "Invite member" }}</h2>
          <form class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end" @submit.prevent="onInvite">
            <div class="sm:col-span-1">
              <label :class="labelClass">Email</label>
              <input v-model="invite.email" :class="inputClass" type="email" required />
            </div>
            <div>
              <label :class="labelClass">Role</label>
              <select v-model="invite.role" :class="inputClass">
                <option value="admin">admin</option>
                <option value="recruiter">recruiter</option>
              </select>
            </div>
            <button
              type="submit"
              :disabled="inviting"
              class="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 min-h-11"
            >
              {{ inviting ? (t("loadingDots") || "…") : (t("companyTeam.sendInvite") || "Send invite") }}
            </button>
          </form>
        </section>

        <!-- Pending -->
        <section v-if="canManage" class="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6 overflow-x-auto">
          <h2 class="text-base font-semibold text-slate-900 mb-4">
            {{ t("companyTeam.pending") || "Pending invitations" }}
          </h2>
          <p v-if="!pendingInvites.length" class="text-sm text-slate-500 py-4 text-center">
            {{ t("companyTeam.noPending") || "No pending invitations." }}
          </p>
          <table v-else class="w-full text-sm text-left">
            <thead class="text-slate-500 border-b border-slate-100">
              <tr>
                <th class="py-2 pr-3 font-medium">Email</th>
                <th class="py-2 pr-3 font-medium">Role</th>
                <th class="py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inv in pendingInvites" :key="inv.id" class="border-b border-slate-50">
                <td class="py-3 pr-3">{{ inv.email }}</td>
                <td class="py-3 pr-3 capitalize">{{ inv.role }}</td>
                <td class="py-3 space-x-3">
                  <button type="button" class="text-blue-600 hover:underline" @click="onResend(inv)">
                    {{ t("companyTeam.resend") || "Resend" }}
                  </button>
                  <button type="button" class="text-red-600 hover:underline" @click="onRevoke(inv)">
                    {{ t("companyTeam.revoke") || "Revoke" }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- Transfer -->
        <section v-if="isOwner" class="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
          <h2 class="text-base font-semibold text-slate-900 mb-4">
            {{ t("companyTeam.transfer") || "Transfer ownership" }}
          </h2>
          <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <div class="flex-1">
              <label :class="labelClass">{{ t("companyTeam.newOwner") || "New owner" }}</label>
              <select v-model="transferUserId" :class="inputClass">
                <option value="">{{ t("companyTeam.selectMember") || "Select member" }}</option>
                <option v-for="m in transferCandidates" :key="m.user_id" :value="m.user_id">
                  {{ memberName(m) }} ({{ m.email || m.user_id }})
                </option>
              </select>
            </div>
            <button
              type="button"
              :disabled="!transferUserId || transferring"
              class="inline-flex items-center justify-center rounded-xl border border-amber-300 bg-amber-50 px-5 py-2.5 text-sm font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-60 min-h-11"
              @click="onTransfer"
            >
              {{ transferring ? (t("loadingDots") || "…") : (t("companyTeam.transferBtn") || "Transfer") }}
            </button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
