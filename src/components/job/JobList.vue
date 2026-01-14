<template>
  <div class="space-y-3">
    <JobCard
      v-for="job in jobs"
      :key="job.id"
      :job="job"
    />
  </div>
</template>

<script setup>
import JobCard from "./JobCard.vue"

const jobs = [
  {
    id: 1,
    title: "Frontend Developer",
    company: "Tech Corp",
    location: "Remote",
    salary: "$1000–1500",
    posted_at: "2 days ago"
  },
  {
    id: 2,
    title: "Backend Engineer",
    company: "Startup XYZ",
    location: "Jakarta",
    salary: null,
    posted_at: "1 day ago"
  }
]
</script>
