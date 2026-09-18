<script setup>
import Skeleton from "./Skeleton.vue";
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <div class="flex gap-2 mb-6">
      <Skeleton class="h-4 w-12" />
      <Skeleton class="h-4 w-4" />
      <Skeleton class="h-4 w-16" />
      <Skeleton class="h-4 w-4" />
      <Skeleton class="h-4 w-40" />
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div class="flex gap-4">
            <Skeleton class="h-16 w-16 rounded-lg shrink-0" rounded="rounded-lg" />
            <div class="flex-1 space-y-2">
              <Skeleton class="h-7 w-3/4" />
              <Skeleton class="h-4 w-1/2" />
            </div>
          </div>
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-5/6" />
        </div>
        <div class="bg-white rounded-lg shadow-md p-6 space-y-3">
          <Skeleton class="h-5 w-36" />
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-4/5" />
        </div>
      </div>
      <div class="space-y-4">
        <div class="bg-white rounded-lg shadow-md p-6 space-y-3">
          <Skeleton class="h-10 w-full rounded-lg" rounded="rounded-lg" />
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-2/3" />
        </div>
      </div>
    </div>
  </div>
</template>
