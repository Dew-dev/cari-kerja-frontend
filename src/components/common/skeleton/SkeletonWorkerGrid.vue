<script setup>
import Skeleton from "./Skeleton.vue";

defineProps({
  count: { type: Number, default: 6 },
});
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div v-for="n in count" :key="n" class="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div class="flex items-start gap-4">
        <Skeleton class="h-12 w-12 rounded-full shrink-0" rounded="rounded-full" />
        <div class="flex-1 space-y-2">
          <Skeleton class="h-5 w-2/3" />
          <Skeleton class="h-4 w-1/2" />
        </div>
      </div>
      <Skeleton class="h-4 w-full" />
      <div class="flex gap-2">
        <Skeleton class="h-6 w-14 rounded-full" rounded="rounded-full" />
        <Skeleton class="h-6 w-16 rounded-full" rounded="rounded-full" />
      </div>
    </div>
  </div>
</template>
