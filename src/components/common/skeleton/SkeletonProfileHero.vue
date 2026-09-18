<script setup>
import Skeleton from "./Skeleton.vue";
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
    <div class="bg-linear-to-r from-slate-200/80 to-slate-300/60 rounded-2xl p-5 sm:p-8">
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <Skeleton class="h-20 w-20 sm:h-24 sm:w-24 rounded-xl shrink-0" rounded="rounded-xl" />
        <div class="flex-1 space-y-3 w-full">
          <Skeleton class="h-7 w-2/3 max-w-md" />
          <Skeleton class="h-4 w-1/3 max-w-xs" />
          <Skeleton class="h-4 w-1/2 max-w-sm" />
        </div>
      </div>
    </div>
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 space-y-4">
      <Skeleton class="h-5 w-32" />
      <Skeleton class="h-4 w-full" />
      <Skeleton class="h-4 w-full" />
      <Skeleton class="h-4 w-4/5" />
    </div>
  </div>
</template>
