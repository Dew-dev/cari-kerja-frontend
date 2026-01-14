<template>
  <div class="bg-white border border-border rounded-md p-4 flex justify-between hover:shadow-sm transition">
    <div>
      <h3 class="font-semibold text-base mb-1">{{ job.title }}</h3>
      <p class="text-sm text-primary">{{ job.company }}</p>
      <p class="text-xs text-muted mt-1">
        {{ job.location }} · {{ job.salary || "Salary not specified" }}
      </p>
    </div>

    <div class="flex flex-col items-end gap-2">
      <button class="bg-primary text-white text-sm px-4 py-1.5 rounded">
        Apply
      </button>
      <span class="text-xs text-muted">{{ job.posted_at }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({ job: Object })
</script>
