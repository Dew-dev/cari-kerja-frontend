<template>
  <div class="space-y-4 p-4">
    <div
      v-for="n in 6"
      :key="n"
      class="flex items-center gap-3 animate-pulse"
    >
      <!-- Avatar -->
      <div class="w-11 h-11 rounded-full bg-gray-200 shrink-0" />
      <!-- Text lines -->
      <div class="flex-1 space-y-2">
        <div class="h-3.5 bg-gray-200 rounded w-1/3" />
        <div class="h-3 bg-gray-100 rounded w-2/3" />
      </div>
      <!-- Timestamp -->
      <div class="h-3 bg-gray-200 rounded w-10 shrink-0" />
    </div>
  </div>
</template>
