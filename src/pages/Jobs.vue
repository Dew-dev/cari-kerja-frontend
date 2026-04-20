<template>
  <div class="w-auto mx-auto py-6">
    <!-- Mobile filter toggle -->
    <div class="md:hidden mb-4">
      <button
        @click="showFilter = !showFilter"
        class="flex items-center gap-2 border border-border rounded-md px-4 py-2 text-sm font-medium bg-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
        </svg>
        {{ showFilter ? 'Hide Filters' : 'Show Filters' }}
      </button>
    </div>

    <div class="grid md:grid-cols-[260px_1fr] gap-6">

      <!-- Filter -->
      <aside :class="['md:block', showFilter ? 'block' : 'hidden']">
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
import { ref } from 'vue'
import JobFilter from "../components/job/JobFilter.vue"
import JobList from "../components/job/JobList.vue"

const showFilter = ref(false)
</script>
