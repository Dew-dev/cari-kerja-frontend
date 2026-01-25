<script setup>
import RecruiterSidebar from "@/components/recruiter/RecruiterSidebar.vue"
</script>

<template>
  <div class="flex min-h-[calc(100vh-56px)]">
    <!-- SIDEBAR -->
    <RecruiterSidebar />

    <!-- CONTENT -->
    <main class="flex-1 bg-gray-50 p-6">
      <router-view />
    </main>
  </div>
</template>
