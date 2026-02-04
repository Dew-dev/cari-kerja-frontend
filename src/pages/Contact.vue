<template>
  <div class="max-w-290 mx-auto px-4 py-12">
    <!-- Hero -->
    <section class="text-center mb-10">
      <h1 class="text-4xl font-extrabold mb-3">Contact Us</h1>
      <p class="text-gray-600 max-w-2xl mx-auto">
        Have a question or need help? Reach out to our team — we are here to
        help employers and job seekers alike.
      </p>
    </section>

    <div class="grid md:grid-cols-3 gap-8 mb-12">
      <!-- Contact info -->
      <div class="md:col-span-1 bg-white p-6 rounded shadow-sm">
        <h2 class="font-bold text-lg mb-4">Main office</h2>
        <p class="text-gray-700">
          123 Jobs Street<br />Cityname, Country 10001
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
            <a href="mailto:info@jobs.uz" class="text-blue-600 font-medium"
              >info@jobs.uz</a
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
          <div class="font-semibold">Working hours</div>
          <div>Mon — Fri: 9:00 — 18:00</div>
          <div>Sat: 10:00 — 14:00</div>
        </div>
      </div>

      <!-- Departments -->
      <div class="md:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded shadow-sm">
          <h3 class="font-semibold mb-2">Support</h3>
          <p class="text-sm text-gray-600">
            For general enquiries and technical support.
          </p>
          <div class="mt-4 text-sm">
            <div>
              Email:
              <a class="text-blue-600" href="mailto:support@jobs.uz"
                >support@jobs.uz</a
              >
            </div>
            <div>
              Phone:
              <a class="text-blue-600" href="tel:+1234567891"
                >+1 (234) 567-891</a
              >
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded shadow-sm">
          <h3 class="font-semibold mb-2">Recruiters</h3>
          <p class="text-sm text-gray-600">
            Questions about posting jobs, packages and HR services.
          </p>
          <div class="mt-4 text-sm">
            <div>
              Email:
              <a class="text-blue-600" href="mailto:recruiters@jobs.uz"
                >recruiters@jobs.uz</a
              >
            </div>
            <div>
              Phone:
              <a class="text-blue-600" href="tel:+1234567892"
                >+1 (234) 567-892</a
              >
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded shadow-sm">
          <h3 class="font-semibold mb-2">Advertising</h3>
          <p class="text-sm text-gray-600">
            Partnership and advertising opportunities.
          </p>
          <div class="mt-4 text-sm">
            <div>
              Email:
              <a class="text-blue-600" href="mailto:ads@jobs.uz">ads@jobs.uz</a>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded shadow-sm">
          <h3 class="font-semibold mb-2">Press</h3>
          <p class="text-sm text-gray-600">
            Media enquiries and press releases.
          </p>
          <div class="mt-4 text-sm">
            <div>
              Email:
              <a class="text-blue-600" href="mailto:press@jobs.uz"
                >press@jobs.uz</a
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Contact form + Map -->
    <div class="grid lg:grid-cols-2 gap-8">
      <div class="bg-white p-6 rounded shadow-sm">
        <h2 class="font-bold text-lg mb-4">Send us a message</h2>
        <form @submit.prevent="onSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Your name</label>
            <input
              v-model="form.name"
              type="text"
              class="w-full border rounded px-3 py-2"
              placeholder="Full name"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Email</label>
            <input
              v-model="form.email"
              type="email"
              class="w-full border rounded px-3 py-2"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Subject</label>
            <input
              v-model="form.subject"
              type="text"
              class="w-full border rounded px-3 py-2"
              placeholder="Subject"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Message</label>
            <textarea
              v-model="form.message"
              class="w-full border rounded px-3 py-2 h-28"
              placeholder="Write your message"
            ></textarea>
          </div>

          <div class="flex items-center gap-3">
            <button
              type="submit"
              class="bg-blue-500 text-white px-4 py-2 rounded font-semibold"
            >
              Send message
            </button>
            <div v-if="sent" class="text-green-600 font-medium">
              Your message was sent (demo).
            </div>
          </div>
        </form>
      </div>

      <div class="bg-white p-6 rounded shadow-sm">
        <h2 class="font-bold text-lg mb-4">Our location</h2>
        <div
          class="w-full h-72 bg-gray-100 flex items-center justify-center rounded overflow-hidden"
        >
          <!-- Map placeholder: replace with iframe or map component if available -->
          <div class="text-center text-gray-500">
            Map placeholder
            <div class="text-xs mt-2">
              Add Google Maps iframe or a static map here
            </div>
          </div>
        </div>

        <div class="mt-4 text-sm text-gray-600">
          <div class="font-semibold">Postal address</div>
          <div>123 Jobs Street, Cityname, Country</div>
        </div>
      </div>
    </div>

    <!-- Footer note -->
    <div class="mt-12 text-sm text-gray-600">
      <p>
        For urgent inquiries call
        <a href="tel:+1234567890" class="text-blue-600">+1 (234) 567-890</a>.
        For other matters use the form above or email one of our departments
        directly.
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";

const form = reactive({ name: "", email: "", subject: "", message: "" });
const sent = ref(false);

function onSubmit() {
  // Demo behavior: show a success message and reset form
  sent.value = true;
  setTimeout(() => {
    form.name = "";
    form.email = "";
    form.subject = "";
    form.message = "";
    sent.value = false;
  }, 1600);
}

function mounted() {
  document.title = "Job Portal - Contact";
}
mounted();
</script>
