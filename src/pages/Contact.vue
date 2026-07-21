<template>
  <div class="contact-page bg-[#f7f9fc] min-h-[70vh]">
    <!-- Hero -->
    <section class="border-b border-[#e8eef5] bg-white">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 py-14 md:py-16">
        <p class="text-sm font-medium tracking-wide text-[#0a9cf5] mb-3">
          Cari Kerja
        </p>
        <h1 class="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
          {{ t("contactPage.title") }}
        </h1>
        <p class="mt-3 text-base md:text-lg text-slate-500 max-w-xl leading-relaxed">
          {{ t("contactPage.subtitle") }}
        </p>
      </div>
    </section>

    <!-- Main: form + info -->
    <section class="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-16">
      <div class="grid lg:grid-cols-12 gap-12 lg:gap-16">
        <!-- Form -->
        <div class="lg:col-span-7">
          <h2 class="text-lg font-semibold text-slate-900 mb-1">
            {{ t("contactPage.sendMessage") }}
          </h2>
          <p class="text-sm text-slate-500 mb-8">
            {{ t("contactPage.formHint") }}
          </p>

          <form @submit.prevent="onSubmit" class="space-y-5" novalidate>
            <div>
              <label for="contact-name" class="contact-label">
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
              <p v-if="errors.name" class="contact-error">{{ errors.name }}</p>
            </div>

            <div class="grid sm:grid-cols-2 gap-5">
              <div>
                <label for="contact-email" class="contact-label">
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
                <p v-if="errors.email" class="contact-error">{{ errors.email }}</p>
              </div>

              <div>
                <label for="contact-phone" class="contact-label">
                  {{ t("contactPage.phone") }}
                  <span class="text-slate-400 font-normal">
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
                <p v-if="errors.phone" class="contact-error">{{ errors.phone }}</p>
              </div>
            </div>

            <div>
              <label for="contact-subject" class="contact-label">
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
              <p v-if="errors.subject" class="contact-error">{{ errors.subject }}</p>
            </div>

            <div>
              <label for="contact-message" class="contact-label">
                {{ t("contactPage.message") }}
                <span class="text-red-500">*</span>
              </label>
              <textarea
                id="contact-message"
                v-model="form.message"
                rows="6"
                :class="inputClass(errors.message)"
                :placeholder="t('contactPage.messagePlaceholder')"
                :aria-invalid="!!errors.message"
                @blur="validateField('message')"
              ></textarea>
              <p v-if="errors.message" class="contact-error">{{ errors.message }}</p>
            </div>

            <!-- Honeypot: bots that fill this are rejected by BE -->
            <div style="display: none" aria-hidden="true">
              <label for="contact-website">Website</label>
              <input
                id="contact-website"
                name="website"
                type="text"
                tabindex="-1"
                autocomplete="off"
                value=""
              />
            </div>

            <TurnstileWidget
              ref="turnstileRef"
              @verified="onCaptchaVerified"
              @expired="onCaptchaExpired"
            />

            <div class="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
              <button
                type="submit"
                :disabled="loading"
                class="inline-flex items-center justify-center px-6 py-3 bg-[#0a9cf5] text-white text-sm font-semibold rounded-md hover:bg-[#0890e0] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a9cf5] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ loading ? t("contactPage.sending") : t("contactPage.sendMessageButton") }}
              </button>

              <p
                v-if="sent"
                class="text-sm font-medium text-emerald-600"
                role="status"
              >
                {{ t("contactPage.messageSent") }}
              </p>
              <p
                v-else-if="submitError"
                class="text-sm font-medium text-red-600"
                role="alert"
              >
                {{ submitError }}
              </p>
            </div>
          </form>
        </div>

        <!-- Side info -->
        <aside class="lg:col-span-5 space-y-10">
          <div>
            <h2 class="text-lg font-semibold text-slate-900 mb-4">
              {{ t("contactPage.mainOffice") }}
            </h2>
            <p class="text-slate-600 leading-relaxed">
              {{ t("contactPage.officeAddressLine1") }}<br />
              {{ t("contactPage.officeAddressLine2") }}
            </p>

            <ul class="mt-6 space-y-4">
              <li>
                <a
                  href="mailto:info@cari-kerja.co.id"
                  class="group flex items-start gap-3 text-slate-700 hover:text-[#0a9cf5] transition-colors"
                >
                  <span
                    class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#e8f5fc] text-[#0a9cf5]"
                    aria-hidden="true"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.75"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V8.5L12 13 3 8.5V17a2 2 0 002 2z"
                      />
                    </svg>
                  </span>
                  <span class="pt-1.5 text-sm font-medium underline-offset-2 group-hover:underline">
                    info@cari-kerja.co.id
                  </span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+622130629515"
                  class="group flex items-start gap-3 text-slate-700 hover:text-[#0a9cf5] transition-colors"
                >
                  <span
                    class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#e8f5fc] text-[#0a9cf5]"
                    aria-hidden="true"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.75"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </span>
                  <span class="pt-1.5 text-sm font-medium underline-offset-2 group-hover:underline">
                    +62 2130629515
                  </span>
                </a>
              </li>
            </ul>

            <div class="mt-6 pt-6 border-t border-[#e8eef5] text-sm text-slate-500 space-y-1">
              <p class="font-medium text-slate-800">{{ t("contactPage.workingHours") }}</p>
              <p>{{ t("contactPage.workingHoursWeekdays") }}</p>
              <p>{{ t("contactPage.workingHoursSat") }}</p>
            </div>
          </div>

          <div>
            <h2 class="text-lg font-semibold text-slate-900 mb-4">
              {{ t("contactPage.support") }}
            </h2>
            <ul class="divide-y divide-[#e8eef5] border-y border-[#e8eef5]">
              <li
                v-for="dept in departments"
                :key="dept.key"
                class="py-4"
              >
                <p class="text-sm font-medium text-slate-900">{{ dept.title }}</p>
                <p class="mt-0.5 text-sm text-slate-500">{{ dept.description }}</p>
                <a
                  :href="`mailto:${dept.email}`"
                  class="mt-2 inline-block text-sm text-[#0a9cf5] hover:underline"
                >
                  {{ dept.email }}
                </a>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </section>

    <!-- Map -->
    <section class="border-t border-[#e8eef5] bg-white">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-14">
        <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <h2 class="text-lg font-semibold text-slate-900">
              {{ t("contactPage.ourLocation") }}
            </h2>
            <p class="mt-1 text-sm text-slate-500">
              {{ t("contactPage.postalAddressLine") }}
            </p>
          </div>
          <p class="text-sm text-slate-500">
            {{ t("contactPage.urgentPrefix") }}
            <a href="tel:+62 2130629515" class="text-[#0a9cf5] hover:underline font-medium">
              +62 2130629515
            </a>
          </p>
        </div>

        <div class="w-full h-64 md:h-80 overflow-hidden rounded-lg border border-[#e8eef5]">
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
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { push } from "notivue";
import { createContactMessage } from "../services/contact-us.api";
import TurnstileWidget from "../components/common/TurnstileWidget.vue";
import { isCaptchaError, isRateLimitedError } from "../utils/apiErrors";

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

const captchaToken = ref("");
const turnstileRef = ref(null);

function onCaptchaVerified(token) {
  captchaToken.value = token;
}

function onCaptchaExpired() {
  captchaToken.value = "";
}

const departments = computed(() => [
  {
    key: "support",
    title: t("contactPage.support"),
    description: t("contactPage.supportDesc"),
    email: "support@cari-kerja.co.id",
  },
  {
    key: "recruiters",
    title: t("contactPage.recruiters"),
    description: t("contactPage.recruitersDesc"),
    email: "recruiters@cari-kerja.co.id",
  },
  {
    key: "advertising",
    title: t("contactPage.advertising"),
    description: t("contactPage.advertisingDesc"),
    email: "ads@cari-kerja.co.id",
  },
  {
    key: "press",
    title: t("contactPage.press"),
    description: t("contactPage.pressDesc"),
    email: "press@cari-kerja.co.id",
  },
]);

function inputClass(error) {
  return [
    "w-full rounded-md border bg-white px-3.5 py-2.5 text-sm text-slate-900",
    "placeholder:text-slate-400 transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-[#0a9cf5]/30 focus:border-[#0a9cf5]",
    error ? "border-red-400" : "border-slate-200 hover:border-slate-300",
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
      captcha_token: captchaToken.value || null,
      website: "",
    });

    sent.value = true;
    push.success(t("contactPage.messageSent"));
    resetForm();
    turnstileRef.value?.reset();

    setTimeout(() => {
      sent.value = false;
    }, 4000);
  } catch (err) {
    if (isRateLimitedError(err)) {
      submitError.value = t("captcha.rateLimited");
      push.warning(submitError.value);
      return;
    }
    if (isCaptchaError(err)) {
      turnstileRef.value?.reset();
      submitError.value = t("captcha.required");
      push.warning(submitError.value);
      return;
    }
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

<style scoped>
.contact-label {
  display: block;
  margin-bottom: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #334155;
}

.contact-error {
  margin-top: 0.375rem;
  font-size: 0.75rem;
  color: #dc2626;
}
</style>
