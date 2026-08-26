<script setup>
import Skeleton from "./Skeleton.vue";

defineProps({
  count: { type: Number, default: 6 },
  columns: { type: String, default: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" },
});
</script>

<template>
  <div :class="['grid gap-6', columns]">
    <div
      v-for="n in count"
      :key="n"
      class="bg-white rounded-lg shadow p-6 space-y-4"
    >
      <Skeleton class="h-10 w-10 rounded-lg" rounded="rounded-lg" />
      <Skeleton class="h-5 w-3/4" />
      <Skeleton class="h-4 w-1/2" />
      <Skeleton class="h-4 w-full" />
      <Skeleton class="h-4 w-5/6" />
    </div>
  </div>
</template>
