<script setup>
import Skeleton from "./Skeleton.vue";

defineProps({
  rows: { type: Number, default: 5 },
  columns: { type: Number, default: 5 },
});
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <div class="hidden sm:grid gap-4 px-4 py-3 bg-slate-50 border-b border-slate-100" :style="{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }">
      <Skeleton v-for="c in columns" :key="`h-${c}`" class="h-3 w-20" />
    </div>
    <div
      v-for="r in rows"
      :key="r"
      class="grid gap-4 px-4 py-4 border-b border-slate-50 last:border-0 items-center"
      :style="{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }"
    >
      <Skeleton v-for="c in columns" :key="`${r}-${c}`" class="h-4" :class="c === 1 ? 'w-3/4' : 'w-full max-w-[120px]'" />
    </div>
  </div>
</template>
