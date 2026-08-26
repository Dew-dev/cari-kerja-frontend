<script setup>
import Skeleton from "./Skeleton.vue";

defineProps({
  fields: { type: Number, default: 6 },
  showAvatar: { type: Boolean, default: false },
});
</script>

<template>
  <div class="space-y-6">
    <div v-if="showAvatar" class="flex items-center gap-5">
      <Skeleton class="h-20 w-20 rounded-2xl shrink-0" rounded="rounded-2xl" />
      <div class="flex-1 space-y-2">
        <Skeleton class="h-4 w-32" />
        <Skeleton class="h-10 w-full max-w-xs" />
      </div>
    </div>
    <section class="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6 space-y-5">
      <Skeleton class="h-5 w-40" />
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div v-for="n in fields" :key="n" class="space-y-2">
          <Skeleton class="h-4 w-24" />
          <Skeleton class="h-11 w-full rounded-xl" rounded="rounded-xl" />
        </div>
      </div>
    </section>
  </div>
</template>
