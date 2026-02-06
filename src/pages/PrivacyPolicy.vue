<template>
  <div class="bg-white">
    <!-- Hero -->
    <section class="py-12 bg-linear-to-r from-blue-50 to-white">
      <div class="max-w-290 mx-auto px-4">
        <div class="max-w-3xl">
          <h1 class="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p class="text-gray-600">Last updated: February 4, 2026</p>
        </div>
      </div>
    </section>

    <!-- Content -->
    <section class="py-12">
      <div class="max-w-290 mx-auto px-4">
        <div class="max-w-3xl prose prose-lg">
          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Introduction</h2>
          <p class="text-gray-700 mb-6">
            Jobs.uz ("we" or "us" or "our") operates the Jobs.uz website. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our service and the choices you have associated with that data.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Information Collection and Use</h2>
          <p class="text-gray-700 mb-4">
            We collect several different types of information for various purposes to provide and improve our service to you:
          </p>
          <ul class="list-disc list-inside text-gray-700 space-y-2 mb-6">
            <li><strong>Account Information:</strong> Name, email address, phone number, and password</li>
            <li><strong>Profile Information:</strong> Resume, work experience, education, skills, and qualifications</li>
            <li><strong>Application Data:</strong> Job applications, cover letters, and application history</li>
            <li><strong>Technical Data:</strong> IP address, browser type, pages visited, and time spent on pages</li>
            <li><strong>Communication Data:</strong> Messages between job seekers and recruiters</li>
          </ul>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Use of Data</h2>
          <p class="text-gray-700 mb-4">
            Jobs.uz uses the collected data for various purposes:
          </p>
          <ul class="list-disc list-inside text-gray-700 space-y-2 mb-6">
            <li>To provide and maintain the service</li>
            <li>To notify you about changes to our service</li>
            <li>To provide customer support</li>
            <li>To gather analysis or valuable information to improve the service</li>
            <li>To monitor the usage of the service</li>
            <li>To detect, prevent, and address technical issues</li>
            <li>To send promotional communications (with your consent)</li>
          </ul>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Security of Data</h2>
          <p class="text-gray-700 mb-6">
            The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal data, we cannot guarantee its absolute security.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Cookies</h2>
          <p class="text-gray-700 mb-6">
            We use cookies to enhance your experience on our platform. Cookies are small files of information that are stored on your computer. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Third-Party Access</h2>
          <p class="text-gray-700 mb-6">
            We may share your information with third parties only in ways that are described in this privacy policy. We do not sell, trade, or rent your personal data to third parties. We may share aggregated, anonymized data with partners for research and marketing purposes.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Disclosure of Data</h2>
          <p class="text-gray-700 mb-4">
            We may disclose your personal data in the following circumstances:
          </p>
          <ul class="list-disc list-inside text-gray-700 space-y-2 mb-6">
            <li>By law or when required by legal process</li>
            <li>To protect the rights, privacy, safety, or property of our company</li>
            <li>In case of a merger, acquisition, or asset sale</li>
            <li>With your explicit consent for any other purpose</li>
          </ul>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Data Retention</h2>
          <p class="text-gray-700 mb-6">
            We will retain your personal data only for as long as necessary to provide our services and fulfill the purposes outlined in this privacy policy. You have the right to request deletion of your account and associated data at any time.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Your Data Rights</h2>
          <p class="text-gray-700 mb-4">
            You have the following rights regarding your personal data:
          </p>
          <ul class="list-disc list-inside text-gray-700 space-y-2 mb-6">
            <li>The right to access your personal data</li>
            <li>The right to correct inaccurate data</li>
            <li>The right to request deletion of your data</li>
            <li>The right to opt-out of marketing communications</li>
            <li>The right to request a copy of your data in a portable format</li>
          </ul>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Changes to This Privacy Policy</h2>
          <p class="text-gray-700 mb-6">
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last updated" date at the top of this policy.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">11. Contact Us</h2>
          <p class="text-gray-700 mb-4">
            If you have any questions about this privacy policy, please contact us at:
          </p>
          <p class="text-gray-700">
            Email: <a href="mailto:privacy@jobs.uz" class="text-blue-600 hover:underline">privacy@jobs.uz</a><br>
            Address: Tashkent, Uzbekistan
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted } from "vue";

onMounted(() => {
  document.title = "Privacy Policy - Jobs.uz";
});
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
