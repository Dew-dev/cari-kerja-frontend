<script setup>
import Skeleton from "./Skeleton.vue";

defineProps({
  compact: { type: Boolean, default: false },
});
</script>

<template>
  <div
    class="rounded-lg shadow bg-white border border-transparent p-4 sm:p-5 md:p-6"
    :class="compact ? 'p-4' : ''"
  >
    <div class="flex flex-col gap-3">
      <Skeleton class="h-14 w-14 sm:h-16 sm:w-16 rounded" rounded="rounded" />
      <div class="space-y-2">
        <Skeleton class="h-5 w-3/4 max-w-xs" />
        <Skeleton class="h-4 w-1/2 max-w-[200px]" />
        <Skeleton class="h-4 w-2/3 max-w-[260px]" />
      </div>
      <Skeleton class="h-4 w-full" />
      <Skeleton class="h-4 w-5/6" />
      <div class="flex gap-2 pt-1">
        <Skeleton class="h-6 w-16 rounded-full" rounded="rounded-full" />
        <Skeleton class="h-6 w-20 rounded-full" rounded="rounded-full" />
      </div>
    </div>
  </div>
</template>
