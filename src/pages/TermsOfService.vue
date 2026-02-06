<template>
  <div class="bg-white">
    <!-- Hero -->
    <section class="py-12 bg-linear-to-r from-blue-50 to-white">
      <div class="max-w-290 mx-auto px-4">
        <div class="max-w-3xl">
          <h1 class="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p class="text-gray-600">Last updated: February 4, 2026</p>
        </div>
      </div>
    </section>

    <!-- Content -->
    <section class="py-12">
      <div class="max-w-290 mx-auto px-4">
        <div class="max-w-3xl prose prose-lg">
          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Agreement to Terms</h2>
          <p class="text-gray-700 mb-6">
            By accessing and using the Jobs.uz website and platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Use License</h2>
          <p class="text-gray-700 mb-4">
            Permission is granted to temporarily download one copy of the materials (information or software) on Jobs.uz platform for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul class="list-disc list-inside text-gray-700 space-y-2 mb-6">
            <li>Modifying or copying the materials</li>
            <li>Using the materials for any commercial purpose or for any public display</li>
            <li>Attempting to decompile or reverse engineer any software contained on Jobs.uz</li>
            <li>Removing any copyright or other proprietary notations from the materials</li>
            <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
          </ul>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Disclaimer</h2>
          <p class="text-gray-700 mb-6">
            The materials on Jobs.uz's website are provided on an 'as is' basis. Jobs.uz makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Limitations</h2>
          <p class="text-gray-700 mb-6">
            In no event shall Jobs.uz or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Jobs.uz, even if Jobs.uz or a Jobs.uz authorized representative has been notified orally or in writing of the possibility of such damage.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Accuracy of Materials</h2>
          <p class="text-gray-700 mb-6">
            The materials appearing on Jobs.uz could include technical, typographical, or photographic errors. Jobs.uz does not warrant that any of the materials on its website are accurate, complete, or current. Jobs.uz may make changes to the materials contained on its website at any time without notice.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Links</h2>
          <p class="text-gray-700 mb-6">
            Jobs.uz has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Jobs.uz of the site. Use of any such linked website is at the user's own risk.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Modifications</h2>
          <p class="text-gray-700 mb-6">
            Jobs.uz may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Governing Law</h2>
          <p class="text-gray-700 mb-6">
            These terms and conditions are governed by and construed in accordance with the laws of Uzbekistan, and you irrevocably submit to the exclusive jurisdiction of the courts located in Tashkent.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">9. User Accounts</h2>
          <p class="text-gray-700 mb-6">
            If you create an account on our platform, you are responsible for maintaining the confidentiality of your account information and password. You agree to accept responsibility for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Prohibited Conduct</h2>
          <p class="text-gray-700 mb-4">
            You agree not to:
          </p>
          <ul class="list-disc list-inside text-gray-700 space-y-2 mb-6">
            <li>Post false, inaccurate, or misleading information</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Harass, abuse, or threaten any other user</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Spam or post unsolicited advertisements</li>
          </ul>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">11. Termination</h2>
          <p class="text-gray-700 mb-6">
            We may terminate or suspend your account and access to the platform immediately, without prior notice or liability, for any reason whatsoever, including if you breach the Terms.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">12. Contact Us</h2>
          <p class="text-gray-700">
            If you have any questions about these Terms of Service, please contact us at <a href="mailto:legal@jobs.uz" class="text-blue-600 hover:underline">legal@jobs.uz</a>
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted } from "vue";

onMounted(() => {
  document.title = "Terms of Service - Jobs.uz";
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
