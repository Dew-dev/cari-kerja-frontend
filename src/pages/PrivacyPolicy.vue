<template>
  <div class="bg-white">
    <!-- Hero -->
    <section class="py-12 bg-linear-to-r from-blue-50 to-white">
      <div class="max-w-290 mx-auto px-4">
        <div class="max-w-3xl">
          <h1 class="text-4xl font-bold text-gray-900 mb-4">
            {{ t("privacyPolicy.title") }}
          </h1>
          <p class="text-gray-600">{{ t("privacyPolicy.lastUpdated") }}</p>
        </div>
      </div>
    </section>

    <!-- Content -->
    <section class="py-12">
      <div class="max-w-290 mx-auto px-4">
        <div class="max-w-3xl prose prose-lg">
          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">
            {{ t("privacyPolicy.introduction.title") }}
          </h2>
          <p class="text-gray-700 mb-6">
            {{ t("privacyPolicy.introduction.content") }}
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">
            {{ t("privacyPolicy.informationCollection.title") }}
          </h2>
          <p class="text-gray-700 mb-4">
            {{ t("privacyPolicy.informationCollection.intro") }}
          </p>
          <ul class="list-disc list-inside text-gray-700 space-y-2 mb-6">
            <li>
              <strong>{{
                t(
                  "privacyPolicy.informationCollection.items.accountTitle",
                  "Account Information:",
                )
              }}</strong>
              {{ t("privacyPolicy.informationCollection.items.account") }}
            </li>
            <li>
              <strong>{{
                t(
                  "privacyPolicy.informationCollection.items.profileTitle",
                  "Profile Information:",
                )
              }}</strong>
              {{ t("privacyPolicy.informationCollection.items.profile") }}
            </li>
            <li>
              <strong>{{
                t(
                  "privacyPolicy.informationCollection.items.applicationTitle",
                  "Application Data:",
                )
              }}</strong>
              {{ t("privacyPolicy.informationCollection.items.application") }}
            </li>
            <li>
              <strong>{{
                t(
                  "privacyPolicy.informationCollection.items.technicalTitle",
                  "Technical Data:",
                )
              }}</strong>
              {{ t("privacyPolicy.informationCollection.items.technical") }}
            </li>
            <li>
              <strong>{{
                t(
                  "privacyPolicy.informationCollection.items.communicationTitle",
                  "Communication Data:",
                )
              }}</strong>
              {{ t("privacyPolicy.informationCollection.items.communication") }}
            </li>
          </ul>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">
            {{ t("privacyPolicy.useOfData.title") }}
          </h2>
          <p class="text-gray-700 mb-4">
            {{ t("privacyPolicy.useOfData.content") }}
          </p>
          <ul class="list-disc list-inside text-gray-700 space-y-2 mb-6">
            <li v-for="(item, idx) in useOfDataItems" :key="idx">
              {{ item }}
            </li>
          </ul>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">
            {{ t("privacyPolicy.security.title") }}
          </h2>
          <p class="text-gray-700 mb-6">
            {{ t("privacyPolicy.security.content") }}
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">
            {{ t("privacyPolicy.cookies.title") }}
          </h2>
          <p class="text-gray-700 mb-6">
            {{ t("privacyPolicy.cookies.content") }}
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">
            {{ t("privacyPolicy.thirdPartyAccess.title") }}
          </h2>
          <p class="text-gray-700 mb-6">
            {{ t("privacyPolicy.thirdPartyAccess.content") }}
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">
            {{ t("privacyPolicy.disclosure.title") }}
          </h2>
          <p class="text-gray-700 mb-4">
            {{ t("privacyPolicy.disclosure.intro") }}
          </p>
          <ul class="list-disc list-inside text-gray-700 space-y-2 mb-6">
            <li>{{ t("privacyPolicy.disclosure.items.byLaw") }}</li>
            <li>{{ t("privacyPolicy.disclosure.items.protect") }}</li>
            <li>{{ t("privacyPolicy.disclosure.items.merger") }}</li>
            <li>{{ t("privacyPolicy.disclosure.items.consent") }}</li>
          </ul>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">
            {{ t("privacyPolicy.retention.title") }}
          </h2>
          <p class="text-gray-700 mb-6">
            {{ t("privacyPolicy.retention.content") }}
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">
            {{ t("privacyPolicy.rights.title") }}
          </h2>
          <p class="text-gray-700 mb-4">
            {{ t("privacyPolicy.rights.intro") }}
          </p>
          <ul class="list-disc list-inside text-gray-700 space-y-2 mb-6">
            <li v-for="(item, idx) in rightsItems" :key="idx">{{ item }}</li>
          </ul>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">
            {{ t("privacyPolicy.changes.title") }}
          </h2>
          <p class="text-gray-700 mb-6">
            {{ t("privacyPolicy.changes.content") }}
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">
            {{ t("privacyPolicy.contact.title") }}
          </h2>
          <p class="text-gray-700 mb-4">
            {{ t("privacyPolicy.contact.intro") }}
          </p>
          <p class="text-gray-700">
            {{ t("privacyPolicy.contact.emailLabel") }}:
            <a
              :href="`mailto:${t('privacyPolicy.contact.email')}`"
              class="text-blue-600 hover:underline"
              >{{ t("privacyPolicy.contact.email") }}</a
            ><br />
            {{ t("privacyPolicy.contact.addressLabel") }}:
            {{ t("privacyPolicy.contact.address") }}
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, watch, computed } from "vue";
import { useI18n } from "vue-i18n";

const { t, locale, getLocaleMessage } = useI18n({ useScope: "global" });

// compute list values from translations (works for objects or arrays)
const useOfDataItems = computed(() => {
  const msg = getLocaleMessage(locale.value)?.privacyPolicy?.useOfData?.items;
  if (!msg) return [];
  // if it's an array, return as-is; if object, return values preserving insertion order
  return Array.isArray(msg) ? msg : Object.values(msg);
});

const rightsItems = computed(() => {
  const msg = getLocaleMessage(locale.value)?.privacyPolicy?.rights?.items;
  if (!msg) return [];
  return Array.isArray(msg) ? msg : Object.values(msg);
});

onMounted(() => {
  document.title = t("privacyPolicy.title");
});

watch(
  () => t("privacyPolicy.title"),
  (val) => {
    document.title = val;
  },
  { immediate: true },
);
</script>

<style scoped>
.max-w-290 {
  max-width: 1100px;
}

.bg-linear-to-r {
  background-image: linear-gradient(
    90deg,
    rgba(59, 130, 246, 0.06),
    rgba(255, 255, 255, 0)
  );
}

.prose {
  color: #374151;
}

.prose h2 {
  color: #111827;
}

.prose a {
  color: #2563eb;
}

.prose a:hover {
  text-decoration: underline;
}
</style>
