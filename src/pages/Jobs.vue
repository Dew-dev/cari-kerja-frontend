<template>
  <div class="w-auto mx-auto py-6">
    <div class="grid grid-cols-[260px_1fr] gap-6">

      <!-- Filter -->
      <aside>
        <JobFilter />
      </aside>

      <!-- Job List -->
      <section>
        <JobList />
      </section>

    </div>
  </div>
</template>

<script setup>
import JobFilter from "../components/job/JobFilter.vue"
import JobList from "../components/job/JobList.vue"
</script>
