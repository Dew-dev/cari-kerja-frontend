<template>
  <div class="bg-white">
    <!-- Hero -->
    <section class="bg-linear-to-r from-blue-50 to-white py-12">
      <div class="max-w-290 mx-auto px-4">
        <div class="grid gap-6 md:grid-cols-2 items-center">
          <div>
            <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              About Jobs.uz
            </h1>
            <p class="text-gray-700 mb-4">
              Jobs.uz is Uzbekistan's leading job marketplace. We connect
              talented professionals with companies looking for the right
              people. Since our founding we've been focused on making the job
              search and hiring process fast, transparent and human.
            </p>

            <div class="flex flex-wrap gap-3">
              <a
                href="#mission"
                class="px-4 py-2 bg-blue-600 text-white rounded hover:opacity-90"
                >Our mission</a
              >
              <a
                href="#history"
                class="px-4 py-2 border border-gray-200 rounded hover:bg-gray-50"
                >History</a
              >
            </div>
          </div>

          <div class="hidden md:block">
            <img src="/vite.svg" alt="about" class="w-full max-w-sm mx-auto" />
          </div>
        </div>
      </div>
    </section>

    <!-- Mission -->
    <section id="mission" class="py-12">
      <div class="max-w-290 mx-auto px-4">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-2xl font-semibold mb-3">Our mission</h2>
          <p class="text-gray-700 mb-4">
            We make it easy for people to find meaningful work and for companies
            to discover great talent. We believe a strong economy starts with
            everyone having access to fair job opportunities.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="p-4 border rounded text-center">
              <div class="text-3xl font-bold text-blue-600">1M+</div>
              <div class="text-sm text-gray-600">Job seekers helped</div>
            </div>
            <div class="p-4 border rounded text-center">
              <div class="text-3xl font-bold text-blue-600">150k</div>
              <div class="text-sm text-gray-600">Active job ads</div>
            </div>
            <div class="p-4 border rounded text-center">
              <div class="text-3xl font-bold text-blue-600">18</div>
              <div class="text-sm text-gray-600">Years operating</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- History / Timeline -->
    <section id="history" class="py-12 bg-gray-50">
      <div class="max-w-290 mx-auto px-4">
        <h2 class="text-2xl font-semibold mb-6">Our story</h2>

        <div class="space-y-6">
          <div class="flex gap-4 items-start">
            <div
              class="shrink-0 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold"
            >
              2006
            </div>
            <div>
              <h3 class="font-semibold">Founded</h3>
              <p class="text-gray-600">
                Jobs.uz launched as a small classifieds site and quickly became
                the go-to place for job search in the country.
              </p>
            </div>
          </div>

          <div class="flex gap-4 items-start">
            <div
              class="shrink-0 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold"
            >
              2010
            </div>
            <div>
              <h3 class="font-semibold">Growth</h3>
              <p class="text-gray-600">
                We introduced company profiles, CV uploads and improved search
                tools. Employers started using our platform to hire at scale.
              </p>
            </div>
          </div>

          <div class="flex gap-4 items-start">
            <div
              class="shrink-0 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold"
            >
              2020
            </div>
            <div>
              <h3 class="font-semibold">Modern platform</h3>
              <p class="text-gray-600">
                A complete redesign, faster search and mobile-friendly apps made
                our service accessible to more people across Uzbekistan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Team / Contact -->
    <section class="py-12">
      <div class="max-w-290 mx-auto px-4">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-2xl font-semibold mb-4">Get in touch</h2>
          <p class="text-gray-700 mb-6">
            For press and partnership inquiries, or if you'd like to join our
            team, reach out to us:
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 class="font-semibold">Head Office</h4>
              <p class="text-gray-600">Tashkent, Uzbekistan</p>
              <p class="text-gray-600 mt-2">
                Email:
                <a
                  href="mailto:info@jobs.uz"
                  class="text-blue-600 hover:underline"
                  >info@jobs.uz</a
                >
              </p>
            </div>

            <div>
              <h4 class="font-semibold">Careers</h4>
              <p class="text-gray-600">
                Interested in working with us? Send your CV to
                <a
                  href="mailto:careers@jobs.uz"
                  class="text-blue-600 hover:underline"
                  >careers@jobs.uz</a
                >
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-12 bg-blue-600 text-white">
      <div class="max-w-290 mx-auto px-4 text-center">
        <h3 class="text-xl font-semibold mb-3">
          Looking for talent or your next job?
        </h3>
        <div class="flex justify-center gap-3">
          <router-link
            to="/jobs"
            class="px-4 py-2 bg-white text-blue-600 rounded font-semibold"
            >Search jobs</router-link
          >
          <router-link
            to="/regcruiter"
            class="px-4 py-2 border border-white rounded"
            >For employers</router-link
          >
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted } from "vue";

onMounted(() => {
  document.title = "Jobs.uz - About";
});
</script>

<style scoped>
.max-w-290 {
  max-width: 1100px;
}
</style>
