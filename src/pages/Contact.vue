<template>
  <div class="bg-white">
    <!-- Hero -->
    <section class="py-12 bg-linear-to-r from-blue-50 to-white">
      <div class="max-w-290 mx-auto px-4 text-center">
        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          {{ t("contactPage.title") }}
        </h1>
        <p class="text-gray-700 max-w-2xl mx-auto">
          {{ t("contactPage.subtitle") }}
        </p>
      </div>
    </section>

    <!-- Contact info + departments -->
    <section class="py-10">
      <div class="max-w-290 mx-auto px-4">
        <div class="grid md:grid-cols-3 gap-6 mb-10">
          <div class="md:col-span-1 bg-white border rounded p-6">
            <h2 class="font-semibold text-lg mb-4">
              {{ t("contactPage.mainOffice") }}
            </h2>
            <p class="text-gray-700">
              {{ t("contactPage.officeAddressLine1") }}<br />
              {{ t("contactPage.officeAddressLine2") }}
            </p>

            <div class="mt-4 space-y-3">
              <div class="flex items-center gap-3">
                <svg
                  class="w-5 h-5 text-blue-600 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V8.5L12 13 3 8.5V17a2 2 0 002 2z"
                  />
                </svg>
                <a
                  href="mailto:info@cari-kerja.id"
                  class="text-blue-600 font-medium hover:underline"
                >
                  info@cari-kerja.id
                </a>
              </div>

              <div class="flex items-center gap-3">
                <svg
                  class="w-5 h-5 text-blue-600 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <a
                  href="tel:+622112345678"
                  class="text-blue-600 font-medium hover:underline"
                >
                  +62 21 1234 5678
                </a>
              </div>
            </div>

            <div class="mt-6 text-sm text-gray-600">
              <div class="font-semibold text-gray-900">
                {{ t("contactPage.workingHours") }}
              </div>
              <div>{{ t("contactPage.workingHoursWeekdays") }}</div>
              <div>{{ t("contactPage.workingHoursSat") }}</div>
            </div>
          </div>

          <div class="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              v-for="dept in departments"
              :key="dept.key"
              class="bg-white border rounded p-5 hover:shadow-sm transition-shadow"
            >
              <h3 class="font-semibold mb-2">{{ dept.title }}</h3>
              <p class="text-sm text-gray-600">{{ dept.description }}</p>
              <div class="mt-4 text-sm space-y-1">
                <div>
                  {{ t("contactPage.emailLabel") }}
                  <a
                    :href="`mailto:${dept.email}`"
                    class="text-blue-600 hover:underline"
                  >
                    {{ dept.email }}
                  </a>
                </div>
                <div v-if="dept.phone">
                  {{ t("contactPage.phoneLabel") }}
                  <a
                    :href="`tel:${dept.phoneTel}`"
                    class="text-blue-600 hover:underline"
                  >
                    {{ dept.phone }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Form + Map -->
    <section class="py-10 bg-gray-50">
      <div class="max-w-290 mx-auto px-4">
        <div class="grid lg:grid-cols-2 gap-6">
          <div class="bg-white border rounded p-6">
            <h2 class="text-xl font-semibold mb-1">
              {{ t("contactPage.sendMessage") }}
            </h2>
            <p class="text-sm text-gray-600 mb-5">
              {{ t("contactPage.formHint") }}
            </p>

            <form @submit.prevent="onSubmit" class="space-y-4" novalidate>
              <div>
                <label for="contact-name" class="block text-sm font-medium text-gray-700 mb-1">
                  {{ t("contactPage.yourName") }}
                  <span class="text-red-500">*</span>
                </label>
                <input
                  id="contact-name"
                  v-model="form.name"
                  type="text"
                  maxlength="100"
                  autocomplete="name"
                  :class="inputClass(errors.name)"
                  :placeholder="t('contactPage.fullNamePlaceholder')"
                  :aria-invalid="!!errors.name"
                  @blur="validateField('name')"
                />
                <p v-if="errors.name" class="text-red-600 text-xs mt-1">
                  {{ errors.name }}
                </p>
              </div>

              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label for="contact-email" class="block text-sm font-medium text-gray-700 mb-1">
                    {{ t("contactPage.email") }}
                    <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="contact-email"
                    v-model="form.email"
                    type="email"
                    autocomplete="email"
                    :class="inputClass(errors.email)"
                    :placeholder="t('contactPage.emailPlaceholder')"
                    :aria-invalid="!!errors.email"
                    @blur="validateField('email')"
                  />
                  <p v-if="errors.email" class="text-red-600 text-xs mt-1">
                    {{ errors.email }}
                  </p>
                </div>

                <div>
                  <label for="contact-phone" class="block text-sm font-medium text-gray-700 mb-1">
                    {{ t("contactPage.phone") }}
                    <span class="text-gray-400 font-normal">
                      ({{ t("contactPage.optional") }})
                    </span>
                  </label>
                  <input
                    id="contact-phone"
                    v-model="form.phone"
                    type="tel"
                    autocomplete="tel"
                    :class="inputClass(errors.phone)"
                    :placeholder="t('contactPage.phonePlaceholder')"
                    :aria-invalid="!!errors.phone"
                    @blur="validateField('phone')"
                  />
                  <p v-if="errors.phone" class="text-red-600 text-xs mt-1">
                    {{ errors.phone }}
                  </p>
                </div>
              </div>

              <div>
                <label for="contact-subject" class="block text-sm font-medium text-gray-700 mb-1">
                  {{ t("contactPage.subject") }}
                  <span class="text-red-500">*</span>
                </label>
                <input
                  id="contact-subject"
                  v-model="form.subject"
                  type="text"
                  maxlength="255"
                  :class="inputClass(errors.subject)"
                  :placeholder="t('contactPage.subjectPlaceholder')"
                  :aria-invalid="!!errors.subject"
                  @blur="validateField('subject')"
                />
                <p v-if="errors.subject" class="text-red-600 text-xs mt-1">
                  {{ errors.subject }}
                </p>
              </div>

              <div>
                <label for="contact-message" class="block text-sm font-medium text-gray-700 mb-1">
                  {{ t("contactPage.message") }}
                  <span class="text-red-500">*</span>
                </label>
                <textarea
                  id="contact-message"
                  v-model="form.message"
                  rows="5"
                  :class="inputClass(errors.message)"
                  :placeholder="t('contactPage.messagePlaceholder')"
                  :aria-invalid="!!errors.message"
                  @blur="validateField('message')"
                ></textarea>
                <p v-if="errors.message" class="text-red-600 text-xs mt-1">
                  {{ errors.message }}
                </p>
              </div>

              <div class="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                <button
                  type="submit"
                  :disabled="loading"
                  class="px-5 py-2.5 bg-blue-600 text-white rounded font-semibold hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {{ loading ? t("contactPage.sending") : t("contactPage.sendMessageButton") }}
                </button>

                <p
                  v-if="sent"
                  class="text-green-600 text-sm font-medium"
                  role="status"
                >
                  {{ t("contactPage.messageSent") }}
                </p>
                <p
                  v-else-if="submitError"
                  class="text-red-600 text-sm font-medium"
                  role="alert"
                >
                  {{ submitError }}
                </p>
              </div>
            </form>
          </div>

          <div class="bg-white border rounded p-6">
            <h2 class="text-xl font-semibold mb-4">
              {{ t("contactPage.ourLocation") }}
            </h2>
            <div class="w-full h-72 rounded overflow-hidden border">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15864.26870054287!2d106.78179234035217!3d-6.254880647547309!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f165799752f3%3A0x4ad95e19454832f0!2sOscorp%20Building!5e0!3m2!1sen!2sid!4v1696846200955!5m2!1sen!2sid"
                width="100%"
                height="100%"
                style="border: 0"
                allowfullscreen=""
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
                :title="t('contactPage.ourLocation')"
              ></iframe>
            </div>

            <div class="mt-4 text-sm text-gray-600">
              <div class="font-semibold text-gray-900">
                {{ t("contactPage.postalAddress") }}
              </div>
              <div>{{ t("contactPage.postalAddressLine") }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer note -->
    <section class="py-10">
      <div class="max-w-290 mx-auto px-4">
        <p class="text-sm text-gray-600">
          {{ t("contactPage.urgentPrefix") }}
          <a href="tel:+622112345678" class="text-blue-600 hover:underline">
            +62 21 1234 5678
          </a>.
          {{ t("contactPage.urgentSuffix") }}
        </p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import { createContactMessage } from "../services/contact-us.api";

const { t } = useI18n();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s\-()]{8,20}$/;

const form = reactive({
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
});

const errors = reactive({
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
});

const loading = ref(false);
const sent = ref(false);
const submitError = ref("");

const departments = computed(() => [
  {
    key: "support",
    title: t("contactPage.support"),
    description: t("contactPage.supportDesc"),
    email: "support@cari-kerja.id",
    phone: "+62 21 1234 5679",
    phoneTel: "+622112345679",
  },
  {
    key: "recruiters",
    title: t("contactPage.recruiters"),
    description: t("contactPage.recruitersDesc"),
    email: "recruiters@cari-kerja.id",
    phone: "+62 21 1234 5680",
    phoneTel: "+622112345680",
  },
  {
    key: "advertising",
    title: t("contactPage.advertising"),
    description: t("contactPage.advertisingDesc"),
    email: "ads@cari-kerja.id",
    phone: null,
    phoneTel: null,
  },
  {
    key: "press",
    title: t("contactPage.press"),
    description: t("contactPage.pressDesc"),
    email: "press@cari-kerja.id",
    phone: null,
    phoneTel: null,
  },
]);

function inputClass(error) {
  return [
    "w-full border rounded px-3 py-2 text-gray-900 placeholder:text-gray-400",
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
    error ? "border-red-400" : "border-gray-300",
  ].join(" ");
}

function validateField(field) {
  const value = String(form[field] ?? "").trim();

  switch (field) {
    case "name":
      if (!value) {
        errors.name = t("contactPage.validation.nameRequired");
      } else if (value.length > 100) {
        errors.name = t("contactPage.validation.nameMax");
      } else {
        errors.name = "";
      }
      break;
    case "email":
      if (!value) {
        errors.email = t("contactPage.validation.emailRequired");
      } else if (!EMAIL_RE.test(value)) {
        errors.email = t("contactPage.validation.emailInvalid");
      } else {
        errors.email = "";
      }
      break;
    case "phone":
      if (value && !PHONE_RE.test(value)) {
        errors.phone = t("contactPage.validation.phoneInvalid");
      } else {
        errors.phone = "";
      }
      break;
    case "subject":
      if (!value) {
        errors.subject = t("contactPage.validation.subjectRequired");
      } else if (value.length > 255) {
        errors.subject = t("contactPage.validation.subjectMax");
      } else {
        errors.subject = "";
      }
      break;
    case "message":
      if (!value) {
        errors.message = t("contactPage.validation.messageRequired");
      } else {
        errors.message = "";
      }
      break;
    default:
      break;
  }

  return !errors[field];
}

function validateForm() {
  const fields = ["name", "email", "phone", "subject", "message"];
  return fields.map(validateField).every(Boolean);
}

function resetForm() {
  form.name = "";
  form.email = "";
  form.phone = "";
  form.subject = "";
  form.message = "";
  Object.keys(errors).forEach((key) => {
    errors[key] = "";
  });
}

async function onSubmit() {
  submitError.value = "";
  sent.value = false;

  if (!validateForm()) return;

  loading.value = true;

  try {
    await createContactMessage({
      name: form.name.trim(),
      email: form.email.trim(),
      subject: form.subject.trim(),
      message: form.message.trim(),
      phone: form.phone.trim() || null,
    });

    sent.value = true;
    push.success(t("contactPage.messageSent"));
    resetForm();

    setTimeout(() => {
      sent.value = false;
    }, 4000);
  } catch (err) {
    const message =
      err?.response?.data?.message || t("contactPage.sendFailed");
    submitError.value = message;
    push.error(message);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  document.title = t("contactPage.pageTitle");
});
</script>
