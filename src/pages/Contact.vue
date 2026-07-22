<template>
  <div class="max-w-290 mx-auto px-4 py-12">
    <!-- Hero -->
    <section class="text-center mb-10">
      <h1 class="text-4xl font-extrabold mb-3">{{ $t("contactPage.title") }}</h1>
      <p class="text-gray-600 max-w-2xl mx-auto">
        {{ $t("contactPage.subtitle") }}
      </p>
    </section>

    <div class="grid md:grid-cols-3 gap-8 mb-12">
      <!-- Contact info -->
      <div class="md:col-span-1 bg-white p-6 rounded shadow-sm">
        <h2 class="font-bold text-lg mb-4">{{ $t("contactPage.mainOffice") }}</h2>
        <p class="text-gray-700">
          {{ $t("contactPage.officeAddressLine1") }}<br />
          {{ $t("contactPage.officeAddressLine2") }}
        </p>

        <div class="mt-4">
          <div class="flex items-center gap-3 mt-3">
            <svg
              class="w-5 h-5 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V8.5L12 13 3 8.5V17a2 2 0 002 2z"
              />
            </svg>
            <a href="mailto:info@cari-kerja.id" class="text-blue-600 font-medium"
              >info@cari-kerja.id</a
            >
          </div>

          <div class="flex items-center gap-3 mt-3">
            <svg
              class="w-5 h-5 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 5h12M9 3v2m0 12h6m-6 4h6"
              />
            </svg>
            <a href="tel:+1234567890" class="text-blue-600 font-medium"
              >+1 (234) 567-890</a
            >
          </div>
        </div>

        <div class="mt-6 text-sm text-gray-600">
          <div class="font-semibold">{{ $t("contactPage.workingHours") }}</div>
          <div>{{ $t("contactPage.workingHoursWeekdays") }}</div>
          <div>{{ $t("contactPage.workingHoursSat") }}</div>
        </div>
      </div>

      <!-- Departments -->
      <div class="md:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded shadow-sm">
          <h3 class="font-semibold mb-2">{{ $t("contactPage.support") }}</h3>
          <p class="text-sm text-gray-600">
            {{ $t("contactPage.supportDesc") }}
          </p>
          <div class="mt-4 text-sm">
            <div>
              {{ $t("contactPage.emailLabel") }}
              <a class="text-blue-600" href="mailto:support@cari-kerja.id"
                >support@cari-kerja.id</a
              >
            </div>
            <div>
              {{ $t("contactPage.phoneLabel") }}
              <a class="text-blue-600" href="tel:+1234567891"
                >+1 (234) 567-891</a
              >
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded shadow-sm">
          <h3 class="font-semibold mb-2">{{ $t("contactPage.recruiters") }}</h3>
          <p class="text-sm text-gray-600">
            {{ $t("contactPage.recruitersDesc") }}
          </p>
          <div class="mt-4 text-sm">
            <div>
              {{ $t("contactPage.emailLabel") }}
              <a class="text-blue-600" href="mailto:recruiters@cari-kerja.id"
                >recruiters@cari-kerja.id</a
              >
            </div>
            <div>
              {{ $t("contactPage.phoneLabel") }}
              <a class="text-blue-600" href="tel:+1234567892"
                >+1 (234) 567-892</a
              >
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded shadow-sm">
          <h3 class="font-semibold mb-2">{{ $t("contactPage.advertising") }}</h3>
          <p class="text-sm text-gray-600">
            {{ $t("contactPage.advertisingDesc") }}
          </p>
          <div class="mt-4 text-sm">
            <div>
              {{ $t("contactPage.emailLabel") }}
              <a class="text-blue-600" href="mailto:ads@cari-kerja.id">ads@cari-kerja.id</a>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded shadow-sm">
          <h3 class="font-semibold mb-2">{{ $t("contactPage.press") }}</h3>
          <p class="text-sm text-gray-600">
            {{ $t("contactPage.pressDesc") }}
          </p>
          <div class="mt-4 text-sm">
            <div>
              {{ $t("contactPage.emailLabel") }}
              <a class="text-blue-600" href="mailto:press@cari-kerja.id"
                >press@cari-kerja.id</a
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Contact form + Map -->
    <div class="grid lg:grid-cols-2 gap-8">
      <div class="bg-white p-6 rounded shadow-sm">
        <h2 class="font-bold text-lg mb-4">{{ $t("contactPage.sendMessage") }}</h2>
        <form @submit.prevent="onSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">{{ $t("contactPage.yourName") }}</label>
            <input
              v-model="form.name"
              type="text"
              class="w-full border rounded px-3 py-2"
              :placeholder="$t('contactPage.fullNamePlaceholder')"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">{{ $t("contactPage.email") }}</label>
            <input
              v-model="form.email"
              type="email"
              class="w-full border rounded px-3 py-2"
              :placeholder="$t('contactPage.emailPlaceholder')"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">{{ $t("contactPage.subject") }}</label>
            <input
              v-model="form.subject"
              type="text"
              class="w-full border rounded px-3 py-2"
              :placeholder="$t('contactPage.subjectPlaceholder')"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">{{ $t("contactPage.message") }}</label>
            <textarea
              v-model="form.message"
              class="w-full border rounded px-3 py-2 h-28"
              :placeholder="$t('contactPage.messagePlaceholder')"
            ></textarea>
          </div>

          <div class="flex items-center gap-3">
            <button
              type="submit"
              :disabled="loading"
              class="bg-blue-500 text-white px-4 py-2 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ loading ? $t("contactPage.sending") : $t("contactPage.sendMessageButton") }}
            </button>
            <div v-if="sent" class="text-green-600 font-medium">
              {{ $t("contactPage.messageSent") }}
            </div>
            <div v-if="error" class="text-red-600 font-medium">
              {{ error }}
            </div>
          </div>
        </form>
      </div>

      <div class="bg-white p-6 rounded shadow-sm">
        <h2 class="font-bold text-lg mb-4">{{ $t("contactPage.ourLocation") }}</h2>
        <div class="w-full h-72 rounded overflow-hidden">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15864.26870054287!2d106.78179234035217!3d-6.254880647547309!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f165799752f3%3A0x4ad95e19454832f0!2sOscorp%20Building!5e0!3m2!1sen!2sid!4v1696846200955!5m2!1sen!2sid"
            width="100%"
            height="100%"
            style="border:0;"
            allowfullscreen=""
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>

        <div class="mt-4 text-sm text-gray-600">
          <div class="font-semibold">{{ $t("contactPage.postalAddress") }}</div>
          <div>{{ $t("contactPage.postalAddressLine") }}</div>
        </div>
      </div>
    </div>

    <!-- Footer note -->
    <div class="mt-12 text-sm text-gray-600">
      <p>
        {{ $t("contactPage.urgentPrefix") }}
        <a href="tel:+1234567890" class="text-blue-600">+1 (234) 567-890</a>.
        {{ $t("contactPage.urgentSuffix") }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import axios from "axios";

const { t } = useI18n();
const form = reactive({ name: "", email: "", subject: "", message: "" });
const sent = ref(false);
const loading = ref(false);
const error = ref("");

async function onSubmit() {
  loading.value = true;
  error.value = "";

  try {
    const baseURL = import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_FILE_STORAGE_URL}/api/v1`;
    const response = await axios.post(`${baseURL}/contact-us`, {
      name: form.name,
      email: form.email,
      subject: form.subject,
      message: form.message,
    });

    sent.value = true;
    setTimeout(() => {
      form.name = "";
      form.email = "";
      form.subject = "";
      form.message = "";
      sent.value = false;
    }, 1600);
  } catch (err) {
    error.value = err.response?.data?.message || t("contactPage.sendFailed");
  } finally {
    loading.value = false;
  }
}

function mounted() {
  document.title = t("contactPage.pageTitle");
}
mounted();
</script>
