<script setup>
import Skeleton from "./Skeleton.vue";
</script>

<template>
  <div class="space-y-8">
    <div class="flex justify-center">
      <Skeleton class="h-11 w-72 max-w-full rounded-2xl" rounded="rounded-2xl" />
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="n in 4" :key="n" class="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <Skeleton class="h-5 w-24" />
        <Skeleton class="h-8 w-20" />
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-5/6" />
        <Skeleton class="h-10 w-full rounded-xl mt-4" rounded="rounded-xl" />
      </div>
    </div>
  </div>
</template>
