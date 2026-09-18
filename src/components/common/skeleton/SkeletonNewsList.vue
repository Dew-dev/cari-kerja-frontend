<script setup>
import Skeleton from "./Skeleton.vue";

defineProps({
  count: { type: Number, default: 3 },
  layout: { type: String, default: "grid" },
});
</script>

<template>
  <div v-if="layout === 'detail'" class="max-w-3xl mx-auto space-y-4 py-8">
    <Skeleton class="h-8 w-3/4" />
    <Skeleton class="h-4 w-1/3" />
    <Skeleton class="h-48 w-full rounded-xl" rounded="rounded-xl" />
    <Skeleton class="h-4 w-full" />
    <Skeleton class="h-4 w-full" />
    <Skeleton class="h-4 w-5/6" />
  </div>
  <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <div v-for="n in count" :key="n" class="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100">
      <Skeleton class="h-40 w-full rounded-none" rounded="rounded-none" />
      <div class="p-4 space-y-2">
        <Skeleton class="h-5 w-4/5" />
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-2/3" />
      </div>
    </div>
  </div>
</template>
