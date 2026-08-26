<script setup>
import Skeleton from "./Skeleton.vue";

defineProps({
  count: { type: Number, default: 5 },
  avatar: { type: Boolean, default: true },
});
</script>

<template>
  <div class="space-y-3">
    <div v-for="n in count" :key="n" class="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-100">
      <Skeleton v-if="avatar" class="h-10 w-10 rounded-full shrink-0" rounded="rounded-full" />
      <div class="flex-1 space-y-2">
        <Skeleton class="h-4 w-1/3" />
        <Skeleton class="h-3 w-2/3" />
      </div>
      <Skeleton class="h-8 w-16 rounded-lg shrink-0" rounded="rounded-lg" />
    </div>
  </div>
</template>
